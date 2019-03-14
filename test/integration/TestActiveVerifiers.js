import { mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';
import { registerVerifiers, updateActiveStatus } from '../helpers/RegisterVerifiers';

import createProposals from '../samples/proposals';

const {
  deployContractRegistry,
  deployChain,
  deployVerifierRegistry,
} = require('../helpers/deployers');

const verifiersCount = 3;
const phaseDuration = 5 * verifiersCount * 2;
const requirePercentOfTokens = 70;

contract('Chain: testing active/non active verifiers', (accounts) => {
  let ministroChain;
  let verifierRegistry;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, proposals, secrets, blindedProposals,
  } = proposalsObj;

  before(async () => {
    const contractRegistry = await deployContractRegistry();
    verifierRegistry = await deployVerifierRegistry(accounts[0], contractRegistry.address);

    await registerVerifiers(
      accounts[0], verifiersAddr,
      contractRegistry.address, verifierRegistry.address,
    );
    ministroChain = await deployChain(
      accounts[0], contractRegistry.address, phaseDuration,
      requirePercentOfTokens, true,
    );
  });


  describe('when all verifiers are inactive', async () => {
    before(async () => {
      const awaits = [];
      verifiersAddr.map((verifier) => {
        awaits.push(updateActiveStatus(verifierRegistry, accounts[0], verifier, false));
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
            awaits.push(updateActiveStatus(verifierRegistry, accounts[0], verifier, true));
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
                awaits.push(updateActiveStatus(verifierRegistry, accounts[0], verifier, false));
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
  });
});
