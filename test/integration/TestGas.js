import { getBlockHeight, mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';

import createProposals from '../samples/proposals';

const {
  deployChain,
} = require('../helpers/deployers');

contract('Chain - test GAS', (accounts) => {
  let ministroChain;

  const verifiersCount = 9;
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

    await mineUntilReveal(proposePhaseDuration, revealPhaseDuration);
  });


  it('should be optimized', async () => {
    // NOTICE: testing gas optimization - all below calls are perform only to check,
    // how much gas it cost to do each transactions,
    // you can change the order or create another scenarios
    // to see gar results, go to `truffle.js` and uncomment mocha - reporter, then run:
    // truffle test <thisFile>
    await mineUntilPropose(proposePhaseDuration, revealPhaseDuration);

    let blockHeight = await getBlockHeight(proposePhaseDuration, revealPhaseDuration);
    const awaits = [];
    for (let i = 0; i < verifiersAddr.length; i += 1) {
      awaits.push(ministroChain.instance.propose(
        blindedProposals[i],
        blockHeight,
        { from: verifiersAddr[i] },
      ));
    }
    await Promise.all(awaits);

    await mineUntilReveal(proposePhaseDuration, revealPhaseDuration);
    await ministroChain.instance.reveal(proposals[0], secrets[0], { from: verifiersAddr[0] });

    await mineUntilPropose(proposePhaseDuration, revealPhaseDuration);
    blockHeight = await getBlockHeight(proposePhaseDuration, revealPhaseDuration);

    await ministroChain.instance.propose(
      blindedProposals[0],
      blockHeight,
      { from: verifiersAddr[0] },
    );
  });
});
