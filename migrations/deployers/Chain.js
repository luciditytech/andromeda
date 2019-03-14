const getConfig = require('../helpers/getConfig');

module.exports = (
  deployer,
  network,
  accounts,
  ContractRegistryArtifacts,
  ChainArtifacts,
  ChainStorageArtifacts,
) => deployer.then(async () => {
  const { options, config } = getConfig(network, accounts);

  let contractRefgistry;
  if (config.ContractRegistryAddress) {
    contractRefgistry = await ContractRegistryArtifacts.at(config.ContractRegistryAddress);
  } else {
    contractRefgistry = await ContractRegistryArtifacts.deployed();
    config.ContractRegistryAddress = contractRefgistry.address;
  }

  const chainStorage = await ChainStorageArtifacts.deployed();

  const instance = await deployer.deploy(
    ChainArtifacts,
    config.ContractRegistryAddress,
    chainStorage.address,
    options,
  );

  await chainStorage.initStorageOwner(instance.address);
  await contractRefgistry.add(instance.address);

  return instance;
});
