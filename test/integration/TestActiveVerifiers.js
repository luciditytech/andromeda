import { fromAscii } from 'web3-utils';

import { mineUntilPropose, mineUntilReveal, getBlockHeight } from '../helpers/SpecHelper';
import { updateActiveStatus } from '../helpers/Verifier';

import createProposals from '../samples/proposals';

const ContractRegistryArtifact = artifacts.require('ContractRegistry');
const VerifierRegistryArtifact = artifacts.require('VerifierRegistry');

const {
  deployChain,
} = require('../helpers/deployers');

const verifiersCount = 3;
const proposePhaseDuration = 5 * verifiersCount * 2;
const revealPhaseDuration = 5 * verifiersCount * 2;
const requirePercentOfTokens = 70;

contract('Chain: testing active/non active verifiers', (accounts) => {
  let ministroChain;
  let verifierRegistry;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, proposals, secrets, blindedProposals,
  } = proposalsObj;

  before(async () => {
    ministroChain = await deployChain(
      accounts[0], verifiersAddr, proposePhaseDuration, revealPhaseDuration,
      requirePercentOfTokens, true,
    );

    const contractRegistry = await ContractRegistryArtifact
      .at(await ministroChain.instance.contractRegistry.call());
    verifierRegistry = await VerifierRegistryArtifact.at(await contractRegistry.contractByName.call(fromAscii('VerifierRegistry')));
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
        await mineUntilPropose(proposePhaseDuration, revealPhaseDuration);
      });

      it('should NOT be possible to propose', async () => {
        const awaits = [];
        const blockHeight = await getBlockHeight(proposePhaseDuration, revealPhaseDuration);
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
            await mineUntilPropose(proposePhaseDuration, revealPhaseDuration);
          });

          it('should be possible to propose', async () => {
            const awaits = [];
            const blockHeight = await getBlockHeight(proposePhaseDuration, revealPhaseDuration);

            for (let i = 0; i < verifiersCount; i += 1) {
              awaits.push(ministroChain.propose(
                blindedProposals[i],
                blockHeight,
                { from: verifiersAddr[i] },
              ));
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
                await mineUntilReveal(proposePhaseDuration, revealPhaseDuration);
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
