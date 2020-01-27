const ChainStorageArtifact = artifacts.require('ChainStorage');
const ChainArtifact = artifacts.require('Chain');
const ContractRegistryArtifact = artifacts.require('ContractRegistry');
const VerifierRegistryArtifact = artifacts.require('VerifierRegistry');

const ChainUtil = require('../ministro-contracts/ministroChain');

const config = require('../../config/development');

const deployContractRegistry = async () => ContractRegistryArtifact.new();

async function deployVerifierRegistry(owner, contractRegistryAddr) {
  const contractRegistry = await ContractRegistryArtifact.at(contractRegistryAddr);

  const verifierRegistryInstance = await VerifierRegistryArtifact.new({ from: owner });

  await contractRegistry.add(verifierRegistryInstance.address);

  return verifierRegistryInstance;
}

async function deployChain(
  owner, verifiersAddr,
  blocksPerPropose,
  blocksPerReveal,
  minimumStakingTokenPercentage,
  updateMinimumStakingTokenPercentageEnabled,
) {
  const contractRegistry = await deployContractRegistry();

  const chainStorageInstance = await ChainStorageArtifact.new(
    blocksPerPropose,
    blocksPerReveal,
    minimumStakingTokenPercentage,
    updateMinimumStakingTokenPercentageEnabled,
  );

  const chainInstance = await ChainArtifact.new(
    contractRegistry.address,
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

  const verifierRegistry = await deployVerifierRegistry(owner, contractRegistry.address);

  const mapResults = [];
  verifiersAddr.map(async (addr, i) => {
    const shard = Math.floor(i / config.VerifierRegistry.verifiersPerShard);
    mapResults.push(verifierRegistry.setVerifier(addr, true, i + 1, shard, true));
  });
  await Promise.all(mapResults);

  return ministroChain;
}

module.exports = {
  deployContractRegistry,
  deployChain,
  deployVerifierRegistry,
};
