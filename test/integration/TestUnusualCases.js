import BigNumber from 'bignumber.js';

import { getBlockHeight, mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';

import createProposals from '../samples/proposals';

const {
  deployChain,
} = require('../helpers/deployers');

contract('Chain - unusual cases', (accounts) => {
  let ministroChain;

  const verifiersCount = 3;

  // that testRPC creates 1 block per tx, if you will get revert because of invalid phase,
  // then increase phase duration
  const proposePhaseDuration = verifiersCount * 5;
  const revealPhaseDuration = verifiersCount * 5;
  const requirePercentOfTokens = 70;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, secrets, proposals, blindedProposals,
  } = proposalsObj;

  before(async () => {
    ministroChain = await deployChain(
      accounts[0], verifiersAddr, proposePhaseDuration, revealPhaseDuration,
      requirePercentOfTokens, true,
    );

    const blindedProposalCheck = await ministroChain.createProof(proposals[0], secrets[0]);
    assert.strictEqual(blindedProposals[0], blindedProposalCheck, 'Hasher do not produce same output as blockchain keccak256');

    await mineUntilReveal(proposePhaseDuration, revealPhaseDuration);
  });

  describe('when all verifiers made a proposal', async () => {
    let blockHeigh;

    before(async () => {
      await mineUntilPropose(proposePhaseDuration, revealPhaseDuration);
      const blockHeight = await getBlockHeight(proposePhaseDuration, revealPhaseDuration);

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

      blockHeigh = await ministroChain.getBlockHeight(proposePhaseDuration, revealPhaseDuration);
    });

    describe('when noone reveal', async () => {
      before(async () => {
        await mineUntilReveal(proposePhaseDuration, revealPhaseDuration);
        await mineUntilPropose(proposePhaseDuration, revealPhaseDuration);
      });

      it('should be next exlection cycle', async () => {
        const blockHeigh2 =
          await ministroChain.getBlockHeight(proposePhaseDuration, revealPhaseDuration);

        assert(BigNumber(blockHeigh).plus(1).eq(blockHeigh2), 'invalid block height');
      });


      it('should be possible to propose again (because of new cycle)', async () => {
        const blockHeight = await getBlockHeight(proposePhaseDuration, revealPhaseDuration);
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


      describe('when we enter NEXT reveal phase', async () => {
        before(async () => {
          const blockHeight = await getBlockHeight(proposePhaseDuration, revealPhaseDuration);

          await ministroChain.propose(
            blindedProposals[0],
            blockHeight,
            { from: verifiersAddr[0] },
          );
          await mineUntilReveal(proposePhaseDuration, revealPhaseDuration);
        });

        it('should still be next exlection cycle', async () => {
          const blockHeigh2 =
            await ministroChain.getBlockHeight(proposePhaseDuration, revealPhaseDuration);

          assert(BigNumber(blockHeigh).plus(1).eq(blockHeigh2), 'invalid block height');
        });

        it('should be able to reveal proposals for current/newest election', async () => {
          const awaits = [];
          for (let i = 0; i < verifiersCount; i += 1) {
            awaits
              .push(ministroChain.reveal(proposals[i], secrets[i], { from: verifiersAddr[i] }));
          }
          await Promise.all(awaits);
        });
      });
    });
  });
});
