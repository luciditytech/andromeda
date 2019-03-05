const ChainStorageArtifact = artifacts.require('ChainStorage');
const ChainArtifact = artifacts.require('Chain');
const ContractRegistryArtifact = artifacts.require('ContractRegistry');
const StakingBankStorageArtifact = artifacts.require('StakingBankStorage');
const StakingBankArtifact = artifacts.require('StakingBank');
const VerifierRegistryStorageArtifact = artifacts.require('VerifierRegistryStorage');
const VerifierRegistryArtifact = artifacts.require('VerifierRegistry');
const HumanStandardTokenArtifact = artifacts.require('HumanStandardToken');

const ChainUtil = require('../ministro-contracts/ministroChain');

const config = require('../../config/development');

const deployContractRegistry = async () => ContractRegistryArtifact.new();

const deployHumanStandardToken = async () => HumanStandardTokenArtifact.new(
  config.HumanStandardToken.total,
  config.HumanStandardToken.name,
  config.HumanStandardToken.decimals,
  config.HumanStandardToken.symbol,
);

const deployStakingBank = async (owner, contractRegistryAddr, tokenAddr) => {
  const contractRegistry = await ContractRegistryArtifact.at(contractRegistryAddr);

  const storage = await StakingBankStorageArtifact.new(tokenAddr);

  const stakingBankInstance = await StakingBankArtifact.new(
    contractRegistryAddr,
    storage.address,
  );

  await storage.initStorageOwner(stakingBankInstance.address);
  await contractRegistry.add(stakingBankInstance.address);

  return stakingBankInstance;
};

async function deployVerifierRegistry(owner, contractRegistryAddr) {
  const contractRegistry = await ContractRegistryArtifact.at(contractRegistryAddr);
  const verifierRegistryStorageInstance = await VerifierRegistryStorageArtifact
    .new(config.VerifierRegistry.verifiersPerShard);

  const verifierRegistryInstance = await VerifierRegistryArtifact.new(
    contractRegistryAddr,
    verifierRegistryStorageInstance.address,
  );

  await verifierRegistryStorageInstance.initStorageOwner(
    verifierRegistryInstance.address,
    { from: owner },
  );

  await contractRegistry.add(verifierRegistryInstance.address);

  return verifierRegistryInstance;
}

async function deployChain(
  owner, contractRegistryAddr,
  blocksPerPhase, minimumStakingTokenPercentage, updateMinimumStakingTokenPercentageEnabled,
) {
  const contractRegistry = await ContractRegistryArtifact.at(contractRegistryAddr);

  const chainStorageInstance = await ChainStorageArtifact.new(
    blocksPerPhase,
    minimumStakingTokenPercentage,
    updateMinimumStakingTokenPercentageEnabled,
  );

  const chainInstance = await ChainArtifact.new(
    contractRegistryAddr,
    chainStorageInstance.address,
  );

  await chainStorageInstance.initStorageOwner(
    chainInstance.address,
    { from: owner },
  );

  await contractRegistry.add(chainInstance.address);

  const ministroChain = ChainUtil();
  ministroChain.setInstanceVar(chainInstance);
  ministroChain.setFromVar(owner);

  return ministroChain;
}

module.exports = {
  deployContractRegistry,
  deployChain,
  deployStakingBank,
  deployHumanStandardToken,
  deployVerifierRegistry,
};
