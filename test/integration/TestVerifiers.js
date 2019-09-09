import web3Utils from 'web3-utils';
import sha256 from 'js-sha256';

import { getBlockHeight, mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';
import { isRevealPhase, isProposePhase } from '../helpers/CycleFunctions';

import createProposals from '../samples/proposals';

const {
  deployChain,
} = require('../helpers/deployers');

const verifiersCount = 3;
const phaseDuration = 5 * verifiersCount;
const requirePercentOfTokens = 70;

contract('Chain: 1 or more verifiers scenario (base on configuration)', (accounts) => {
  let ministroChain;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, secrets, proposals, blindedProposals,
  } = proposalsObj;

  beforeEach(async () => {
    ministroChain = await deployChain(
      accounts[0], verifiersAddr, phaseDuration,
      requirePercentOfTokens, true,
    );

    const blindedProposalCheck = await ministroChain.createProof(proposals[0], secrets[0]);
    assert.strictEqual(blindedProposals[0], blindedProposalCheck, 'Hasher do not produce same output as blockchain keccak256');

    await mineUntilReveal(phaseDuration);
  });


  describe('when we are in propose phase', async () => {
    let blockHeight;

    beforeEach(async () => {
      await mineUntilPropose(phaseDuration);

      const blockNumber = await web3.eth.getBlockNumber();
      assert.isTrue(isProposePhase(blockNumber, phaseDuration));
      blockHeight = await getBlockHeight(phaseDuration);
    });

    describe('passing tests', async () => {
      it('should be possible to propose', async () => {
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
    });

    describe('failing tests', async () => {
      describe('when all made valid proposal already', async () => {
        beforeEach(async () => {
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

        it('should NOT be possible to propose same proposal again', async () => {
          const awaits = [];
          for (let i = 0; i < verifiersCount; i += 1) {
            awaits.push(ministroChain.propose(
              blindedProposals[i],
              blockHeight,
              { from: verifiersAddr[i] },
              true,
            ));
          }
          await Promise.all(awaits);
        });

        it('should NOT be possible to propose same proposal using different secrets by the same verifier', async () => {
          const awaits = [];
          for (let i = 0; i < verifiersCount; i += 1) {
            const differentSecret = web3Utils.soliditySha3(secrets[i]);
            const blindedProposal2 = web3Utils.soliditySha3(proposals[i], differentSecret);
            awaits.push(ministroChain.propose(
              blindedProposal2,
              blockHeight,
              { from: verifiersAddr[i] },
              true,
            ));
          }
          await Promise.all(awaits);
        });

        it('should NOT be possible to propose different proposal by same verifier', async () => {
          const awaits = [];
          for (let i = 0; i < verifiersCount; i += 1) {
            // lets prepare another proposal
            const proposal2 = web3Utils.soliditySha3(sha256.hex(`${proposals[i]}_`));
            const blindedProposal2 = web3Utils.soliditySha3(proposal2, secrets[i]);
            awaits.push(ministroChain.propose(
              blindedProposal2,
              blockHeight,
              {},
              true,
            ));
          }
          await Promise.all(awaits);
        });
      });

      it('should NOT be possible to reveal', async () => {
        const awaits = [];
        for (let i = 0; i < verifiersCount; i += 1) {
          awaits
            .push(ministroChain
              .reveal(proposals[i], secrets[i], blockHeight, { from: verifiersAddr[i] }, true));
        }
        await Promise.all(awaits);
      });
    });

    describe('when all proposed', async () => {
      beforeEach(async () => {
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

      describe('when we enter revealing phase', async () => {
        let revealResults;

        beforeEach(async () => {
          await mineUntilReveal(phaseDuration);

          const blockNumber = await web3.eth.getBlockNumber();
          assert.isTrue(isRevealPhase(blockNumber, phaseDuration));
        });

        describe('passing tests', async () => {
          it('should be possible to reveal vote', async () => {
            revealResults =
              await ministroChain
                .reveal(proposals[0], secrets[0], blockHeight, { from: verifiersAddr[0] });

            assert.isTrue(
              revealResults.LogUpdateCounters[0].newWinner,
              'it should be a winner - its first vote',
            );

            const awaits = [];
            for (let i = 1; i < verifiersCount; i += 1) {
              awaits.push(ministroChain.reveal(
                proposals[i],
                secrets[i],
                blockHeight,
                { from: verifiersAddr[i] },
              ));
            }
            await Promise.all(awaits);
          });
        });

        describe('failing tests', async () => {
          it('should NOT be possible to reveal using wrong secret', async () => {
            const awaits = [];
            for (let i = 0; i < verifiersCount; i += 1) {
              awaits.push(ministroChain.reveal(proposals[i], `0x${secrets[i].substring(2).split('').reverse().join('')}`, blockHeight, { from: verifiersAddr[i] }, true));
            }
            await Promise.all(awaits);
          });

          describe('when everyone reveal with success', async () => {
            beforeEach(async () => {
              const awaits = [];
              for (let i = 0; i < verifiersCount; i += 1) {
                awaits
                  .push(ministroChain
                    .reveal(proposals[i], secrets[i], blockHeight, { from: verifiersAddr[i] }));
              }
              await Promise.all(awaits);
            });

            it('should NOT be possible to reveal again ', async () => {
              const awaits = [];
              for (let i = 0; i < verifiersCount; i += 1) {
                awaits
                  .push(ministroChain
                    .reveal(
                      proposals[i],
                      secrets[i],
                      blockHeight,
                      { from: verifiersAddr[i] },
                      true,
                    ));
              }
              await Promise.all(awaits);
            });

            it('should NOT be possible to propose', async () => {
              const awaits = [];
              for (let i = 0; i < verifiersCount; i += 1) {
                // try propose
                awaits
                  .push(ministroChain.propose(
                    blindedProposals[i],
                    blockHeight,
                    { from: verifiersAddr[i] },
                    true,
                  ));
              }
              await Promise.all(awaits);
            });
          });
        });

        describe('when everyone revealed', async () => {
          beforeEach(async () => {
            const awaits = [];
            for (let i = 0; i < verifiersCount; i += 1) {
              awaits.push(ministroChain.reveal(
                proposals[i],
                secrets[i],
                blockHeight,
                { from: verifiersAddr[i] },
              ));
            }
            await Promise.all(awaits);
          });

          describe('when we enter NEXT proposal phase', async () => {
            beforeEach(async () => {
              await mineUntilPropose(phaseDuration);

              const blockNumber = await web3.eth.getBlockNumber();
              assert.isTrue(isProposePhase(blockNumber, phaseDuration));
              blockHeight = await getBlockHeight(phaseDuration);
            });

            it('should be able to propose using previous blinded proposal, because its new cycle', async () => {
              const awaits = [];
              // depends on requirements, we can move this test to failing
              // and change contract to not accept this behaviour
              for (let i = 0; i < verifiersCount; i += 1) {
                awaits.push(ministroChain.propose(
                  blindedProposals[i],
                  blockHeight,
                  { from: verifiersAddr[i] },
                ));
              }
              await Promise.all(awaits);
            });
          });
        });
      });
    });
  });
});
