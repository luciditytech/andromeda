import web3Utils from 'web3-utils';
import sha256 from 'js-sha256';
import EthQuery from 'ethjs-query';

import { mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';
import registerVerifiers from '../helpers/RegisterVerifiers';
import { isRevealPhase, isProposePhase } from '../helpers/CycleFunctions';

import createProposals from '../samples/proposals';

const Chain = artifacts.require('Chain');

const ChainUtil = require('../ministro-contracts/ministroChain');

const ministroChain = ChainUtil();

const ethQuery = new EthQuery(web3.currentProvider);

const verifiersCount = 3;
const phaseDuration = 5 * verifiersCount;

contract('Chain: 1 or more verifiers scenario (base on configuration)', (accounts) => {
  let chainInstance;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, secrets, proposals, blindedProposals,
  } = proposalsObj;


  beforeEach(async () => {
    const registryAddr = await registerVerifiers(accounts[0], verifiersAddr);

    chainInstance = await Chain.new(
      registryAddr,
      phaseDuration,
    );

    ministroChain.setInstanceVar(chainInstance);

    const blindedProposalCheck = await ministroChain.createProof(proposals[0], secrets[0]);
    assert.strictEqual(blindedProposals[0], blindedProposalCheck, 'Hasher do not produce same output as blockchain keccak256');

    await mineUntilReveal(phaseDuration);
  });


  describe('when we are in propose phase', async () => {
    beforeEach(async () => {
      await mineUntilPropose(phaseDuration);

      const block = await ethQuery.blockNumber();
      assert.isTrue(isProposePhase(block.toNumber(), phaseDuration));
    });

    describe('passing tests', async () => {
      it('should be possible to propose', async () => {
        const awaits = [];
        for (let i = 0; i < verifiersCount; i += 1) {
          awaits.push(ministroChain.propose(blindedProposals[i], { from: verifiersAddr[i] }));
        }

        await Promise.all(awaits);
      });
    });

    describe('failing tests', async () => {
      describe('when all made valid proposal already', async () => {
        beforeEach(async () => {
          const awaits = [];
          for (let i = 0; i < verifiersCount; i += 1) {
            awaits.push(ministroChain.propose(blindedProposals[i], { from: verifiersAddr[i] }));
          }
          await Promise.all(awaits);
        });

        it('should NOT be possible to propose same proposal again', async () => {
          const awaits = [];
          for (let i = 0; i < verifiersCount; i += 1) {
            awaits.push(ministroChain.propose(
              blindedProposals[i],
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
            awaits.push(ministroChain.propose(blindedProposal2, { from: verifiersAddr[i] }, true));
          }
          await Promise.all(awaits);
        });

        it('should NOT be possible to propose different proposal by same verifier', async () => {
          const awaits = [];
          for (let i = 0; i < verifiersCount; i += 1) {
            // lets prepare another proposal
            const proposal2 = web3Utils.soliditySha3(sha256.hex(`${proposals[i]}_`));
            const blindedProposal2 = web3Utils.soliditySha3(proposal2, secrets[i]);
            awaits.push(ministroChain.propose(blindedProposal2, {}, true));
          }
          await Promise.all(awaits);
        });
      });

      it('should NOT be possible to reveal', async () => {
        const awaits = [];
        for (let i = 0; i < verifiersCount; i += 1) {
          awaits
            .push(ministroChain.reveal(proposals[i], secrets[i], { from: verifiersAddr[i] }, true));
        }
        await Promise.all(awaits);
      });
    });

    describe('when all proposed', async () => {
      beforeEach(async () => {
        const awaits = [];
        for (let i = 0; i < verifiersCount; i += 1) {
          awaits.push(ministroChain.propose(blindedProposals[i], { from: verifiersAddr[i] }));
        }
        await Promise.all(awaits);
      });

      describe('when we enter revealing phase', async () => {
        let revealResults;

        beforeEach(async () => {
          await mineUntilReveal(phaseDuration);

          const block = await ethQuery.blockNumber();
          assert.isTrue(isRevealPhase(block.toNumber(), phaseDuration));
        });

        describe('passing tests', async () => {
          it('should be possible to reveal vote', async () => {
            revealResults =
              await ministroChain.reveal(proposals[0], secrets[0], { from: verifiersAddr[0] });
            assert.isTrue(
              revealResults.LogUpdateCounters[0].newWinner,
              'it should be a winner - its first vote',
            );

            const awaits = [];
            for (let i = 1; i < verifiersCount; i += 1) {
              awaits.push(ministroChain.reveal(
                proposals[i],
                secrets[i],
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
              awaits.push(ministroChain.reveal(proposals[i], `${secrets[i]}_`, { from: verifiersAddr[i] }, true));
            }
            await Promise.all(awaits);
          });

          describe('when everyone reveal with success', async () => {
            beforeEach(async () => {
              const awaits = [];
              for (let i = 0; i < verifiersCount; i += 1) {
                awaits
                  .push(ministroChain
                    .reveal(proposals[i], secrets[i], { from: verifiersAddr[i] }));
              }
              await Promise.all(awaits);
            });

            it('should NOT be possible to reveal again ', async () => {
              const awaits = [];
              for (let i = 0; i < verifiersCount; i += 1) {
                awaits
                  .push(ministroChain
                    .reveal(proposals[i], secrets[i], { from: verifiersAddr[i] }, true));
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
                { from: verifiersAddr[i] },
              ));
            }
            await Promise.all(awaits);
          });

          describe('when we enter NEXT proposal phase', async () => {
            beforeEach(async () => {
              await mineUntilPropose(phaseDuration);

              const block = await ethQuery.blockNumber();
              assert.isTrue(isProposePhase(block.toNumber(), phaseDuration));
            });

            it('should be able to propose using previous blinded proposal, because its new cycle', async () => {
              const awaits = [];
              // depends on requirements, we can move this test to failing
              // and change contract to not accept this behaviour
              for (let i = 0; i < verifiersCount; i += 1) {
                awaits.push(ministroChain.propose(blindedProposals[i], { from: verifiersAddr[i] }));
              }
              await Promise.all(awaits);
            });
          });
        });
      });
    });
  });
});
