import { mineUntilPropose, mineUntilReveal, writeProcessMsg } from '../helpers/SpecHelper';
import registerVerifiers from '../helpers/RegisterVerifiers';
import createProposals from '../samples/proposals';

const Chain = artifacts.require('Chain');

const ChainUtil = require('../ministro-contracts/ministroChain');

const ministroChain = ChainUtil();

contract('Chain - testing cycle, on testRPC 1tx == 1block', (accounts) => {
  const phaseDuration = accounts.length - 1;
  const verifiersCount = phaseDuration;

  let chainInstance;

  const {
    verifiersAddr,
    secrets,
    proposals,
    blindedProposals,
  } = createProposals(verifiersCount, accounts);

  before(async () => {
    const registryAddr = await registerVerifiers(accounts[0], verifiersAddr);

    chainInstance = await Chain.new(
      registryAddr,
      phaseDuration,
    );

    ministroChain.setInstanceVar(chainInstance);
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


        /* eslint-disable-next-line */
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

        /* eslint-disable-next-line */
        await Promise.all(awaits);
        awaits = [];

        nonce = false;
      }
    });
  });
});
