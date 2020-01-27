const {
  deployChain,
} = require('../helpers/deployers');

contract('Chain - testing config', (accounts) => {
  let ministroChain;

  before(async () => {
    ministroChain = await deployChain(accounts[0], [], 100, 10, 70, false);
  });

  it('should have valid config', async () => {
    assert.equal(await ministroChain.instance.blocksPerPropose(), 100);

    assert.equal(await ministroChain.instance.blocksPerReveal(), 10);

    assert.equal(await ministroChain.instance.minimumStakingTokenPercentage(), 70);

    assert.equal(await ministroChain.instance.updateMinimumStakingTokenPercentageEnabled(), false);
  });
});
