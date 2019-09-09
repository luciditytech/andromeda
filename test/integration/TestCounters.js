import web3Utils from 'web3-utils';
import BigNumber from 'bignumber.js';

import { mineUntilReveal, mineUntilPropose, getBlockHeight } from '../helpers/SpecHelper';
import { isProposePhase, isRevealPhase } from '../helpers/CycleFunctions';
import createProposals from '../samples/proposals';

const {
  deployChain,
} = require('../helpers/deployers');

contract('Chain - testing counters', (accounts) => {
  let ministroChain;
  // for this test we need exactly 3
  const verifiersCount = 3;
  const phaseDuration = verifiersCount * 5;
  const requirePercentOfTokens = 70;

  let counter;
  let blockHeight;

  const {
    verifiersAddr,
    secrets,
    proposals,
    blindedProposals,
  } = createProposals(verifiersCount, accounts, true);

  before(async () => {
    counter = new BigNumber(0);

    ministroChain = await deployChain(
      accounts[0],
      verifiersAddr,
      phaseDuration,
      requirePercentOfTokens,
      true,
    );

    await mineUntilReveal(phaseDuration);
  });

  describe('when all verifiers proposed same proposal', () => {
    before(async () => {
      await mineUntilPropose(phaseDuration);

      const blockNumber = await web3.eth.getBlockNumber();
      assert.isTrue(isProposePhase(blockNumber, phaseDuration));

      blockHeight = await getBlockHeight(phaseDuration);
      const awaits = [];

      for (let i = 0; i < verifiersCount; i += 1) {
        awaits.push(ministroChain.propose(
          blindedProposals[i],
          blockHeight,
          { from: verifiersAddr[i] },
        ));
      }

      await Promise.all(awaits);
    });

    describe('when we enter revealing phase', () => {
      before(async () => {
        await mineUntilReveal(phaseDuration);

        const blockNumber = await web3.eth.getBlockNumber();
        assert.isTrue(isRevealPhase(blockNumber, phaseDuration));
      });

      describe('when first verifier revealed', () => {
        const votes = {};
        let revealResult;

        before(async () => {
          revealResult =
            await ministroChain
              .reveal(proposals[0], secrets[0], blockHeight, { from: verifiersAddr[0] });
        });

        it('should be a winner after very first reveal', async () => {
          assert.isTrue(revealResult.LogUpdateCounters[0].newWinner);
          const shard = revealResult.LogUpdateCounters[0].shard.toString(10);

          votes[shard] = revealResult.LogUpdateCounters[0].counts;

          assert.strictEqual(
            counter.plus(revealResult.LogUpdateCounters[0].balance).toString(10),
            revealResult.LogUpdateCounters[0].counts.toString(10),
          );
          counter = revealResult.LogUpdateCounters[0].counts;
        });

        describe('when the rest of verifiers revealed', () => {
          let allResults;

          before(async () => {
            const awaits = [];
            for (let i = 1; i < verifiersCount; i += 1) {
              awaits.push(ministroChain.reveal(
                proposals[i],
                secrets[i],
                blockHeight,
                { from: verifiersAddr[i] },
              ));
            }

            allResults = await Promise.all(awaits);
          });

          it('should be the same winner, because all proposals were the same', async () => {
            allResults.map((result) => {
              assert.isFalse(result.LogUpdateCounters[0].newWinner, 'there should be no new winner');
              return true;
            });
          });
        });
      });
    });
  });


  // has been com verifier for one invalid vote we need at least 2 verifiers per shard
  describe('when one proposal is different', async () => {
    before(async () => {
      proposals[0] = web3Utils.soliditySha3('0x01');
      blindedProposals[0] = web3Utils.soliditySha3(proposals[0], secrets[0]);
    });

    describe('when all proposed', async () => {
      const shards = {};

      before(async () => {
        // now we need to wait for propose phase
        await mineUntilPropose(phaseDuration);

        const blockNumber = await web3.eth.getBlockNumber();
        assert.isTrue(isProposePhase(blockNumber, phaseDuration));

        blockHeight = await getBlockHeight(phaseDuration);
        const awaits = [];
        for (let i = 0; i < verifiersCount; i += 1) {
          awaits.push(ministroChain.propose(
            blindedProposals[i],
            blockHeight,
            { from: verifiersAddr[i] },
          ));
        }
        const results = await Promise.all(awaits);

        results.forEach((res) => {
          shards[res.LogPropose[0].sender] = res.LogPropose[0].shard.toString(10);
        });
      });

      describe('when we have all at least 3 verifiers in shard', async () => {
        // list of shards that we can test
        let validShard = -1;
        const shardsCounter = {};

        before(async () => {
          // we need to make sure we have at lest one shard that has 3 verifiers
          Object.keys(shards).forEach((addr) => {
            const shard = shards[addr];

            shardsCounter[shard] = !shardsCounter[shard] ? 1 : shardsCounter[shard] + 1;
            if (shardsCounter[shard] >= 3) {
              validShard = shard;
            }
          });

          assert(validShard >= 0, 'we need valid shard with at least 3 verifiers');
        });

        describe('when we enter reveal phase', async () => {
          before(async () => {
            await mineUntilReveal(phaseDuration);

            const blockNumber = await web3.eth.getBlockNumber();
            assert.isTrue(isRevealPhase(blockNumber, phaseDuration));
          });

          describe('when first (different) verifier reveal', async () => {
            const votes = {};
            let firstMax = new BigNumber(0);
            let max = new BigNumber(0);

            let firstResults;

            before(async () => {
              firstResults =
                await ministroChain
                  .reveal(proposals[0], secrets[0], blockHeight, { from: verifiersAddr[0] });

              assert.isTrue(firstResults.LogUpdateCounters[0].newWinner, 'first reveal should be a winner');

              firstMax = firstResults.LogUpdateCounters[0].counts;
              votes[proposals[0]] = firstMax;
            });

            describe('when rest of verifiers reveal', async () => {
              let results;

              before(async () => {
                const awaits = [];
                for (let i = 1; i < verifiersCount; i += 1) {
                  awaits.push(ministroChain.reveal(
                    proposals[i],
                    secrets[i],
                    blockHeight,
                    { from: verifiersAddr[i] },
                  ));
                }
                results = await Promise.all(awaits);
              });

              it('should be possible to have another winner, if the rest proposals collect more votes', async () => {
                let wasAnotherWinner = false;

                let winningResults;
                results.map((revealResults) => {
                  const { proposal, balance, newWinner } = revealResults.LogUpdateCounters[0];

                  if (!votes[proposal]) {
                    votes[proposal] = new BigNumber(0);
                    max[proposal] = new BigNumber(0);
                  }

                  assert.strictEqual(proposal, proposals[1], 'every proposal must be the same');

                  votes[proposal] = votes[proposal].plus(balance);
                  max = max.plus(balance);

                  if (newWinner) {
                    wasAnotherWinner = proposal;
                    winningResults = revealResults.LogUpdateCounters;
                  }

                  return votes;
                });

                assert.strictEqual(wasAnotherWinner, proposals[1], 'there should be another winner');
                assert.isTrue(wasAnotherWinner ? max.gt(firstMax) : firstMax.gte(max));

                const root = await ministroChain.getBlockRoot(
                  winningResults[0].blockHeight.toString(10),
                  winningResults[0].shard.toString(10),
                );

                assert.strictEqual(root, wasAnotherWinner);
              });
            });
          });
        });
      });
    });
  });
});
