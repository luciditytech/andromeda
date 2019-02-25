import BigNumber from 'bignumber.js';

import { registerVerifiers } from '../helpers/RegisterVerifiers';

import createProposals from '../samples/proposals';


const Chain = artifacts.require('Chain');

const ChainUtil = require('../ministro-contracts/ministroChain');

const ministroChain = ChainUtil();

const verifiersCount = 9;
const phaseDuration = 5 * verifiersCount;
const requirePercentOfTokens = 70;


contract('Chain: testing minimumStakingTokenPercentage - update enabled', (accounts) => {/*
  let chainInstance;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const { verifiersAddr } = proposalsObj;


  before(async () => {
    const registryAddr = await registerVerifiers(accounts[0], verifiersAddr);

    chainInstance = await Chain.new(
      registryAddr,
      phaseDuration,
      requirePercentOfTokens,
      true,
    );

    ministroChain.setInstanceVar(chainInstance);
  });

  it('update should be enabled', async () => {
    assert.isTrue(await chainInstance.updateMinimumStakingTokenPercentageEnabled.call());
  });

  it('minimumStakingTokenPercentage should have valid initial state', async () => {
    assert.isTrue(
      BigNumber(requirePercentOfTokens).eq(await ministroChain.minimumStakingTokenPercentage()),
      'invalid initial value for minimumStakingTokenPercentage',
    );
  });

  it('should be possible to update minimumStakingTokenPercentage', async () => {
    await ministroChain.updateMinimumStakingTokenPercentage(1, { from: accounts[0] });
  });

  it('should be NOT possible to update minimumStakingTokenPercentage by not an owner', async () => {
    await ministroChain.updateMinimumStakingTokenPercentage(2, { from: accounts[1] }, true);
  });
});

contract('Chain: testing minimumStakingTokenPercentage - update disabled', (accounts) => {
  let chainInstance;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const { verifiersAddr } = proposalsObj;


  before(async () => {
    const registryAddr = await registerVerifiers(accounts[0], verifiersAddr);

    chainInstance = await Chain.new(
      registryAddr,
      phaseDuration,
      requirePercentOfTokens,
      false,
    );

    ministroChain.setInstanceVar(chainInstance);
  });

  it('update should be disabled', async () => {
    assert.isFalse(await chainInstance.updateMinimumStakingTokenPercentageEnabled.call());
  });

  it('minimumStakingTokenPercentage should have valid initial state', async () => {
    assert.isTrue(
      BigNumber(requirePercentOfTokens).eq(await ministroChain.minimumStakingTokenPercentage()),
      'invalid initial value for minimumStakingTokenPercentage',
    );
  });

  it('should be NOT possible to update minimumStakingTokenPercentage', async () => {
    await ministroChain.updateMinimumStakingTokenPercentage(1, { from: accounts[0] }, true);
  });

  it('should be NOT possible to update minimumStakingTokenPercentage by not an owner', async () => {
    await ministroChain.updateMinimumStakingTokenPercentage(2, { from: accounts[1] }, true);
  });*/
});
