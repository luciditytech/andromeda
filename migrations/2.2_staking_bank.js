const getConfig = require('../scripts/getConfig');

const StakingBank = artifacts.require('StakingBank');
const StakingBankStorage = artifacts.require('StakingBankStorage');

module.exports = (deployer, network, accounts) => deployer.then(async () => {
  const { options, config } = getConfig(network, accounts);

  const stakingBankStorage = await StakingBankStorage.deployed();

  const instance = await deployer.deploy(
    StakingBank,
    config.ContractRegistry.address,
    stakingBankStorage.address,
    options,
  );

  await stakingBankStorage.initStorageOwner(instance.address);

  const ContractRegistry = artifacts.require('ContractRegistry');
  const contractRegistry = await ContractRegistry.at(config.ContractRegistry.address);
  await contractRegistry.add(StakingBank.address);

  return instance;
});
