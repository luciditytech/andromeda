import { getBlockHeight, mineUntilPropose, mineUntilReveal, writeProcessMsg } from '../helpers/SpecHelper';
import createProposals from '../samples/proposals';

const {
  deployChain,
} = require('../helpers/deployers');

contract('Chain - testing cycle, on testRPC 1tx == 1block', (accounts) => {
  const proposePhaseDuration = accounts.length * 2;
  const revealPhaseDuration = accounts.length * 2;
  const verifiersCount = accounts.length - 1;
  const requirePercentOfTokens = 70;

  let ministroChain;

  const {
    verifiersAddr,
    secrets,
    proposals,
    blindedProposals,
  } = createProposals(verifiersCount, accounts);

  before(async () => {
    ministroChain = await deployChain(
      accounts[0], verifiersAddr, proposePhaseDuration, revealPhaseDuration,
      requirePercentOfTokens, true,
    );
  });

  describe('when we start at the begin of propose phase', async () => {
    before(async () => {
      await mineUntilReveal(proposePhaseDuration, revealPhaseDuration);
      await mineUntilPropose(proposePhaseDuration, revealPhaseDuration);
    });

    it('should be possible to propose/reveal and repeat', async () => {
      let awaits = [];
      let nonce = true;

      for (let numberOfCycles = 0; numberOfCycles < 3; numberOfCycles += 1) {
        // eslint-disable-next-line
        const blockHeight = await  getBlockHeight(proposePhaseDuration, revealPhaseDuration);

        // for very first time, we are already in propose,
        // so we have 1 block less - that is why we need to start from 1.
        for (let i = nonce ? 1 : 0; blindedProposals[i]; i += 1) {
          awaits.push(ministroChain.propose(
            blindedProposals[i],
            blockHeight,
            { from: verifiersAddr[i] },
          ));
          writeProcessMsg('proposing... ');
        }

        // eslint-disable-next-line
        await Promise.all(awaits);
        awaits = [];

        // eslint-disable-next-line
        await  mineUntilReveal(proposePhaseDuration, revealPhaseDuration);

        for (let i = 0; proposals[i]; i += 1) {
          awaits.push(ministroChain.reveal(
            proposals[i],
            secrets[i],
            { from: verifiersAddr[i] },
            nonce && i === 0,
          ));
          writeProcessMsg('revealing... ');
        }

        // eslint-disable-next-line
        await Promise.all(awaits);
        awaits = [];

        // eslint-disable-next-line
        await mineUntilPropose(proposePhaseDuration, revealPhaseDuration);

        nonce = false;
      }
    });
  });
});
