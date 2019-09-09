import { mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';

import createProposals from '../samples/proposals';

const {
  deployChain,
} = require('../helpers/deployers');

contract('Chain - unusual cases', (accounts) => {
  let ministroChain;
  let blockHeight;
  const verifiersCount = 3;

  // that testRPC creates 1 block per tx, if you will get revert because of invalid phase,
  // then increase phase duration
  const phaseDuration = verifiersCount * 5;
  const requirePercentOfTokens = 70;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, secrets, proposals, blindedProposals,
  } = proposalsObj;

  before(async () => {
    ministroChain = await deployChain(
      accounts[0], verifiersAddr, phaseDuration,
      requirePercentOfTokens, true,
    );

    const blindedProposalCheck = await ministroChain.createProof(proposals[0], secrets[0]);
    assert.strictEqual(blindedProposals[0], blindedProposalCheck, 'Hasher do not produce same output as blockchain keccak256');

    await mineUntilReveal(phaseDuration);
  });

  describe('when all verifiers made a proposal', async () => {
    before(async () => {
      await mineUntilPropose(phaseDuration);
      blockHeight = await ministroChain.getBlockHeight();

      // start with i=1 so we have one "clean" option to propose for test purposes
      const awaits = [];
      for (let i = 1; i < verifiersCount; i += 1) {
        awaits.push(ministroChain.propose(
          blindedProposals[i],
          blockHeight,
          { from: verifiersAddr[i] },
        ));
      }
      await Promise.all(awaits);
    });

    describe('when noone revealed', async () => {
      before(async () => {
        await mineUntilReveal(phaseDuration);
        await mineUntilPropose(phaseDuration);

        const prevBlockHeight = blockHeight;
        blockHeight = await ministroChain.getBlockHeight();
        assert(prevBlockHeight.lt(blockHeight), 'invalid block height');
      });

      it('should be possible to propose again (because of new cycle)', async () => {
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

      describe('when we enter NEXT reveal phase', async () => {
        let nextBlockHeight;

        before(async () => {
          blockHeight = await ministroChain.getBlockHeight();
          await mineUntilReveal(phaseDuration);
          await mineUntilPropose(phaseDuration);
          await mineUntilReveal(phaseDuration);
          nextBlockHeight = await ministroChain.getBlockHeight();
        });

        it('should NOT be possible to reveal proposals with previous block height', async () => {
          const awaits = [];
          for (let i = 0; i < verifiersCount; i += 1) {
            awaits
              .push(ministroChain
                .reveal(proposals[i], secrets[i], blockHeight, { from: verifiersAddr[i] }, true));
          }
          await Promise.all(awaits);
        });

        it('should NOT be possible to reveal proposals with current block height', async () => {
          const awaits = [];
          for (let i = 0; i < verifiersCount; i += 1) {
            awaits
              .push(ministroChain
                .reveal(
                  proposals[i],
                  secrets[i],
                  nextBlockHeight,
                  { from: verifiersAddr[i] },
                  true,
                ));
          }
          await Promise.all(awaits);
        });
      });
    });
  });
});
