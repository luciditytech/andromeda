import { mineUntilPropose, mineUntilReveal, writeProcessMsg } from '../helpers/SpecHelper';
import createProposals from '../samples/proposals';

const {
  deployChain,
} = require('../helpers/deployers');

contract('Chain - testing cycle, on testRPC 1tx == 1block', (accounts) => {
  const phaseDuration = accounts.length - 1;
  const verifiersCount = phaseDuration;
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
      accounts[0], verifiersAddr, phaseDuration,
      requirePercentOfTokens, true,
    );
  });

  describe('when we start at the begin of propose phase', async () => {
    before(async () => {
      await mineUntilReveal(phaseDuration);
      await mineUntilPropose(phaseDuration);
    });

    it('should be possible to propose/reveal and repeat', async () => {
      let awaits = [];
      let nonce = true;

      for (let numberOfCycles = 0; numberOfCycles < 3; numberOfCycles += 1) {
        // for very first time, we are already in propose,
        // so we have 1 block less - that is why we need to start from 1.
        for (let i = nonce ? 1 : 0; blindedProposals[i]; i += 1) {
          awaits.push(ministroChain.propose(blindedProposals[i], { from: verifiersAddr[i] }));
          writeProcessMsg('proposing... ');
        }


        // eslint-disable-next-line
        await Promise.all(awaits);
        awaits = [];

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

        nonce = false;
      }
    });
  });
});
