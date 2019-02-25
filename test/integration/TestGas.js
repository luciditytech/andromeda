import { mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';

import { registerVerifiers } from '../helpers/RegisterVerifiers';
import createProposals from '../samples/proposals';

const ChainUtil = require('../ministro-contracts/ministroChain');

const Chain = artifacts.require('Chain');

const ministroChain = ChainUtil();

contract('Chain - test GAS', (accounts) => {
  let chainInstance;

  const verifiersCount = 9;
  const phaseDuration = verifiersCount * 5;
  const requirePercentOfTokens = 70;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, secrets, proposals, blindedProposals,
  } = proposalsObj;


  before(async () => {
    const registryAddr = await registerVerifiers(accounts[0], verifiersAddr);

    chainInstance = await Chain.new(
      registryAddr,
      phaseDuration,
      requirePercentOfTokens,
      true,
    );

    ministroChain.setInstanceVar(chainInstance);
    ministroChain.setFromVar(verifiersAddr[0]);

    await mineUntilReveal(phaseDuration);
  });


  it('should be optimized', async () => {
    // NOTICE: testing gas optimization - all below calls are perform only to check,
    // how much gas it cost to do each transactions,
    // you can change the order or create another scenarios
    // to see gar results, go to `truffle.js` and uncomment mocha - reporter, then run:
    // truffle test <thisFile>
    await mineUntilPropose(phaseDuration);

    const awaits = [];
    for (let i = 0; i < verifiersAddr.length; i += 1) {
      awaits.push(chainInstance.propose(blindedProposals[i], { from: verifiersAddr[i] }));
    }
    await Promise.all(awaits);

    await mineUntilReveal(phaseDuration);
    await chainInstance.reveal(proposals[0], secrets[0], { from: verifiersAddr[0] });

    await mineUntilPropose(phaseDuration);
    await chainInstance.propose(blindedProposals[0], { from: verifiersAddr[0] });
  });
});
