const {
  deployContractRegistry,
  deployChain,
} = require('../helpers/deployers');

contract('Chain - testing config', (accounts) => {
  let ministroChain;
  let contractRegistry;

  before(async () => {
    contractRegistry = await deployContractRegistry();
    ministroChain = await deployChain(accounts[0], contractRegistry.address, 10, 70, false);
  });

  it('should have valid config', async () => {
    assert.strictEqual(
      (await ministroChain.instance.contractRegistry()).toLowerCase(),
      contractRegistry.address.toLowerCase(),
    );

    assert.equal(
      (await ministroChain.instance.blocksPerPhase()),
      10,
    );

    assert.equal(
      (await ministroChain.instance.minimumStakingTokenPercentage()),
      70,
    );

    assert.equal(
      (await ministroChain.instance.updateMinimumStakingTokenPercentageEnabled()),
      false,
    );
  });
});
