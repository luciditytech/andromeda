const getConfig = require('./helpers/getConfig');

const ChainStorageArtifact = artifacts.require('ChainStorage');
const ChainArtifact = artifacts.require('Chain');

module.exports = (deployer, network, accounts) => deployer.then(async () => {
  const { options, config } = getConfig(network, accounts);

  const chainStorage = await ChainStorageArtifact.deployed();

  const instance = await deployer.deploy(
    ChainArtifact,
    config.ContractRegistry.address,
    chainStorage.address,
    options,
  );

  await chainStorage.initStorageOwner(instance.address);

  return instance;
});
