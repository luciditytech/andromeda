import { getBlockHeight, mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';

import createProposals from '../samples/proposals';

const {
  deployChain,
} = require('../helpers/deployers');

contract('Chain - test GAS', (accounts) => {
  let ministroChain;

  const verifiersCount = 9;
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

    await mineUntilReveal(phaseDuration);
  });


  it('should be optimized', async () => {
    // NOTICE: testing gas optimization - all below calls are perform only to check,
    // how much gas it cost to do each transactions,
    // you can change the order or create another scenarios
    // to see gar results, go to `truffle.js` and uncomment mocha - reporter, then run:
    // truffle test <thisFile>
    await mineUntilPropose(phaseDuration);

    let blockHeight = await getBlockHeight(phaseDuration);
    const awaits = [];
    for (let i = 0; i < verifiersAddr.length; i += 1) {
      awaits.push(ministroChain.instance.propose(
        blindedProposals[i],
        blockHeight,
        { from: verifiersAddr[i] },
      ));
    }
    await Promise.all(awaits);

    await mineUntilReveal(phaseDuration);
    await ministroChain.instance
      .reveal(proposals[0], secrets[0], blockHeight, { from: verifiersAddr[0] });

    await mineUntilPropose(phaseDuration);
    blockHeight = await getBlockHeight(phaseDuration);

    await ministroChain.instance.propose(
      blindedProposals[0],
      blockHeight,
      { from: verifiersAddr[0] },
    );
  });
});
