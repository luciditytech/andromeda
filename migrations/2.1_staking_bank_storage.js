const getConfig = require('../scripts/getConfig');

const StakingBankStorage = artifacts.require('StakingBankStorage');

module.exports = (deployer, network, accounts) => deployer.then(async () => {
  const { options, config } = getConfig(network, accounts);

  return deployer.deploy(
    StakingBankStorage,
    config.HumanStandardToken.address,
    options,
  );
});
