const StakingBankStorage = artifacts.require('StakingBankStorage');
const StakingBank = artifacts.require('StakingBank');
const ContractRegistry = artifacts.require('ContractRegistry');
const VerifierRegistryStorage = artifacts.require('VerifierRegistryStorage');
const VerifierRegistry = artifacts.require('VerifierRegistry');
const HumanStandardToken = artifacts.require('HumanStandardToken');
const Chain = artifacts.require('Chain');

const verifierRegistryConfig = require('digivice/config/development');
const tokenConf = require('token-sale-contracts/conf/development');
const chainConf = require('andromeda/config/development');

const StakingBankUtil = require('../ministro-contracts/ministroStakingBank');

const deployContractRegistry = async () => ContractRegistry.new();

const deployVerifierRegistry = async (contractRegistryAddr) => {
  const contractRegistry = await ContractRegistry.at(contractRegistryAddr);

  const vrStorage = await VerifierRegistryStorage.new(
    verifierRegistryConfig.VerifierRegistry.verifiersPerShard,
  );

  const verifierRegistry = await VerifierRegistry.new(
    contractRegistry.address,
    vrStorage.address,
  );

  await vrStorage.initStorageOwner(verifierRegistry.address);
  await contractRegistry.add(verifierRegistry.address);

  return verifierRegistry;
};

const deployHumanStandardToken = async () => HumanStandardToken.new(
  tokenConf.total,
  tokenConf.name,
  tokenConf.decimals,
  tokenConf.symbol,
);

const deployChain = async (contractRegistryAddr) => {
  const contractRegistry = await ContractRegistry.at(contractRegistryAddr);

  const chain = await Chain.new(
    contractRegistry.address,
    chainConf.Chain.blocksPerPhase,
  );

  await contractRegistry.add(chain.address);

  return chain;
};

const deployStakingBank = async (owner, contractRegistryAddr, tokenAddr) => {
  const contractRegistry = await ContractRegistry.at(contractRegistryAddr);

  const storage = await StakingBankStorage.new(tokenAddr);

  const stakingBankInstance = await StakingBank.new(
    contractRegistryAddr,
    storage.address,
  );

  await storage.initStorageOwner(stakingBankInstance.address);
  await contractRegistry.add(stakingBankInstance.address);

  const ministroStakingBank = StakingBankUtil();
  ministroStakingBank.setInstanceVar(stakingBankInstance);
  ministroStakingBank.setFromVar(owner);

  return {
    stakingBankInstance,
    ministroStakingBank,
  };
};

module.exports = {
  deployContractRegistry,
  deployVerifierRegistry,
  deployHumanStandardToken,
  deployChain,
  deployStakingBank,
};
