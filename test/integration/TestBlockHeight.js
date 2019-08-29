import BigNumber from 'bignumber.js';

import { getBlockHeight, mineUntilPropose } from '../helpers/SpecHelper';

import createProposals from '../samples/proposals';

const {
  deployChain,
} = require('../helpers/deployers');

const verifiersCount = 1;
const phaseDuration = 50 * verifiersCount;
const requirePercentOfTokens = 100;

contract('Chain: testing propose for block height', (accounts) => {
  let ministroChain;
  let blockHeight;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, blindedProposals,
  } = proposalsObj;


  describe('when we are in propose phase', async () => {
    beforeEach(async () => {
      ministroChain = await deployChain(
        accounts[0], verifiersAddr, phaseDuration,
        requirePercentOfTokens, true,
      );

      await mineUntilPropose(phaseDuration);
      blockHeight = await getBlockHeight(phaseDuration);
    });

    it('should NOT be possible to propose for invalid block height', async () => {
      await ministroChain.propose(
        blindedProposals[0],
        BigNumber(blockHeight).plus(1).toString(10),
        { from: verifiersAddr[0] },
        true,
      );
    });

    it('should be possible to propose when valid block height provided', async () => {
      await ministroChain.propose(
        blindedProposals[0],
        blockHeight,
        { from: verifiersAddr[0] },
      );
    });
  });
});
