import { fromAscii } from 'web3-utils';

import { getBlockHeight, mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';
import { updateEnableStatus } from '../helpers/Verifier';

import createProposals from '../samples/proposals';

const ContractRegistryArtifact = artifacts.require('ContractRegistry');
const VerifierRegistryArtifact = artifacts.require('VerifierRegistry');

const {
  deployChain,
} = require('../helpers/deployers');

const verifiersCount = 3;
const phaseDuration = 5 * verifiersCount * 2;
const requirePercentOfTokens = 70;

contract('Chain: testing enabled/disabled verifiers', (accounts) => {
  let ministroChain;
  let verifierRegistry;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, proposals, secrets, blindedProposals,
  } = proposalsObj;

  before(async () => {
    ministroChain = await deployChain(
      accounts[0], verifiersAddr, phaseDuration,
      requirePercentOfTokens, true,
    );

    const contractRegistry = await ContractRegistryArtifact
      .at(await ministroChain.instance.contractRegistry.call());
    verifierRegistry = await VerifierRegistryArtifact.at(await contractRegistry.contractByName.call(fromAscii('VerifierRegistry')));
  });


  describe('when all verifiers are disabled', async () => {
    before(async () => {
      const awaits = [];
      verifiersAddr.map((verifier) => {
        awaits.push(updateEnableStatus(verifierRegistry, accounts[0], verifier, false));
        return true;
      });
      await Promise.all(awaits);
    });

    describe('when we are in propose phase', async () => {
      before(async () => {
        await mineUntilPropose(phaseDuration);
      });

      it('should NOT be possible to propose', async () => {
        const blockHeight = await getBlockHeight(phaseDuration);
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


      describe('when we activate verifiers', async () => {
        before(async () => {
          const awaits = [];
          verifiersAddr.map((verifier) => {
            awaits.push(updateEnableStatus(verifierRegistry, accounts[0], verifier, true));
            return true;
          });
          await Promise.all(awaits);
        });

        describe('when we are in propose phase', async () => {
          before(async () => {
            await mineUntilPropose(phaseDuration);
          });

          it('should be possible to propose', async () => {
            const blockHeigght = await getBlockHeight(phaseDuration);
            const awaits = [];
            for (let i = 0; i < verifiersCount; i += 1) {
              awaits.push(ministroChain.propose(
                blindedProposals[i],
                blockHeigght,
                { from: verifiersAddr[i] },
              ));
            }

            await Promise.all(awaits);
          });

          describe('when verifiers become disabled', async () => {
            before(async () => {
              const awaits = [];
              verifiersAddr.map((verifier) => {
                awaits.push(updateEnableStatus(verifierRegistry, accounts[0], verifier, false));
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
