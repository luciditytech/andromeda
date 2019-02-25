import { mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';
import { registerVerifiers, updateActiveStatus } from '../helpers/RegisterVerifiers';

import createProposals from '../samples/proposals';

const Chain = artifacts.require('Chain');

const ChainUtil = require('../ministro-contracts/ministroChain');

const ministroChain = ChainUtil();

const verifiersCount = 3;
const phaseDuration = 5 * verifiersCount * 2;
const requirePercentOfTokens = 70;

contract('Chain: testing active/non active verifiers', (accounts) => {
  /*
  let chainInstance;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, proposals, secrets, blindedProposals,
  } = proposalsObj;


  before(async () => {
    const registryAddr = await registerVerifiers(accounts[0], verifiersAddr);

    chainInstance = await Chain.new(
      registryAddr,
      phaseDuration,
      requirePercentOfTokens,
      true,
    );

    ministroChain.setInstanceVar(chainInstance);
  });


  describe('when all verifiers are inactive', async () => {
    before(async () => {
      const awaits = [];
      verifiersAddr.map((verifier) => {
        awaits.push(updateActiveStatus(accounts[0], verifier, false));
        return true;
      });
      await Promise.all(awaits);
    });

    describe('when we are in propose phase', async () => {
      before(async () => {
        await mineUntilPropose(phaseDuration);
      });

      it('should NOT be possible to propose', async () => {
        const awaits = [];
        for (let i = 0; i < verifiersCount; i += 1) {
          awaits.push(ministroChain.propose(blindedProposals[i], { from: verifiersAddr[i] }, true));
        }

        await Promise.all(awaits);
      });


      describe('when we activate verifiers', async () => {
        before(async () => {
          const awaits = [];
          verifiersAddr.map((verifier) => {
            awaits.push(updateActiveStatus(accounts[0], verifier, true));
            return true;
          });
          await Promise.all(awaits);
        });

        describe('when we are in propose phase', async () => {
          before(async () => {
            await mineUntilPropose(phaseDuration);
          });

          it('should be possible to propose', async () => {
            const awaits = [];
            for (let i = 0; i < verifiersCount; i += 1) {
              awaits.push(ministroChain.propose(blindedProposals[i], { from: verifiersAddr[i] }));
            }

            await Promise.all(awaits);
          });

          describe('when verifiers become inactive', async () => {
            before(async () => {
              const awaits = [];
              verifiersAddr.map((verifier) => {
                awaits.push(updateActiveStatus(accounts[0], verifier, false));
                return true;
              });
              await Promise.all(awaits);
            });

            describe('they should be able to finish election and reveal vote', async () => {
              before(async () => {
                await mineUntilReveal(phaseDuration);
              });

              it('should be possible to reveal', async () => {
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
            });
          });
        });
      });
    });
  });*/
});
