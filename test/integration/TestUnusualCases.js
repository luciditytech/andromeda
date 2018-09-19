import { mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';

import registerVerifiers from '../helpers/RegisterVerifiers';

import createProposals from '../samples/proposals';

const Chain = artifacts.require('Chain');

const ChainUtil = require('../proxy-contracts/proxyChain');

const proxyChain = ChainUtil();

contract('Chain - unusual cases', (accounts) => {
  let chainInstance;

  const verifiersCount = 3;

  // that testRPC creates 1 block per tx, if you will get revert because of invalid phase,
  const phaseDuration = verifiersCount * 3;

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

    proxyChain.setInstanceVar(chainInstance);
    // proxyChain.setFromVar(verifiersAddr[0])

    const blindedProposalCheck = await proxyChain.createProof(proposals[0], secrets[0]);
    assert.strictEqual(blindedProposals[0], blindedProposalCheck, 'Hasher do not produce same output as blockchain keccak256');

    await mineUntilReveal(phaseDuration);
  });

  describe('when all verifiers made a proposal', async () => {
    beforeEach(async () => {
      await mineUntilPropose(phaseDuration);

      // start with i=1 so we have one "clean" option to propose for test purposes
      const awaits = [];
      for (let i = 1; i < verifiersCount; i += 1) {
        awaits.push(proxyChain.propose(blindedProposals[i], { from: verifiersAddr[i] }));
      }
      await Promise.all(awaits);

      await mineUntilReveal(phaseDuration);
    });

    describe('when noone reveal', async () => {
      beforeEach(async () => {
        await mineUntilReveal(phaseDuration);
        await mineUntilPropose(phaseDuration);
      });


      it('should be possible to propose again (because of new cycle)', async () => {
        const awaits = [];
        for (let i = 1; i < verifiersCount; i += 1) {
          awaits.push(proxyChain.propose(blindedProposals[i], { from: verifiersAddr[i] }));
        }
        await Promise.all(awaits);
      });


      describe('when we enter NEXT reveal phase', async () => {
        beforeEach(async () => {
          await proxyChain.propose(blindedProposals[0], { from: verifiersAddr[0] });
          await mineUntilReveal(phaseDuration);
        });


        it('should NOT be able to reveal "old" proposals', async () => {
          const awaits = [];
          for (let i = 0; i < verifiersCount; i += 1) {
            awaits
              .push(proxyChain.reveal(proposals[i], secrets[i], { from: verifiersAddr[i] }, true));
          }
          await Promise.all(awaits);
        });
      });
    });
  });
});
