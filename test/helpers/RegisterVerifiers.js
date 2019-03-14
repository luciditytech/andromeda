import formatVerifier from '../helpers/Verifier';

const VerifierRegistryArtifact = artifacts.require('VerifierRegistry');

const {
  deployVerifierRegistry,
  deployStakingBank,
  deployHumanStandardToken,
} = require('../helpers/deployers');

async function balancesPerShard(registry, shard) {
  const res = await registry.balancesPerShard.call(shard.toString());
  return res.toString();
}

async function verifiersPerShard(registry) {
  const res = await registry.verifiersPerShard.call();
  return res.toString();
}

function verifierCreated(verifier) {
  let v = verifier;
  if (typeof v.id === 'undefined') v = formatVerifier.format(v);
  return v.id !== '0x0000000000000000000000000000000000000000';
}

async function verifierExists(registry, addr) {
  let res = await registry.verifiers.call(addr);
  res = formatVerifier.format(res);
  return verifierCreated(res);
}

// @return address of registry
async function registerVerifiers(owner, verifiersAddr, contractRegistryAddr, verifierRegistryAddr) {
  const registry = verifierRegistryAddr ? (await VerifierRegistryArtifact.at(verifierRegistryAddr))
    : (await deployVerifierRegistry(owner, contractRegistryAddr));
  const token = await deployHumanStandardToken(owner, contractRegistryAddr);
  const stakingBank = await deployStakingBank(owner, contractRegistryAddr, token.address);

  const amounts = {};

  try {
    const mapResults = verifiersAddr.map(async (addr, i) => {
      if (await verifierExists(registry, addr)) return;
      amounts[addr] = i + 1;
      await token.transfer(addr, amounts[addr], { from: owner });
    });
    await Promise.all(mapResults);
  } catch (e) {
    console.log(e);
    throw new Error('[verifiers registration] transfer fail');
  }

  try {
    const mapResults = [];
    verifiersAddr.map(async (addr, i) => {
      if (!amounts[addr]) return;
      mapResults.push(registry.create(`name.${i + 1}`, `192.168.1.${i + 1}`, { from: addr }));
    });
    await Promise.all(mapResults);
  } catch (e) {
    // verifier is probably registered already if create failing
    // console.log(e);
    // throw new Error('[verifiers registration] create fail');
  }

  try {
    const mapResults = verifiersAddr.map(async (addr) => {
      if (!amounts[addr]) return;
      await token.approveAndCall(stakingBank.address, amounts[addr], '0x0', { from: addr });
    });
    await Promise.all(mapResults);
  } catch (e) {
    console.log(e);
    throw new Error('[verifiers registration] approve fail');
  }

  const mapResults = verifiersAddr.map(async (addr) => {
    let res = await registry.verifiers.call(addr);
    res = formatVerifier.format(res);
    assert.isTrue(verifierCreated(res), 'verifier is not in registry');
    assert.notEqual(parseInt(res.balance, 10), 0, 'verifier must have balance');
  });
  return Promise.all(mapResults);
}

async function updateActiveStatus(registry, regOwner, verifiersAddr, activeStatus) {
  await registry.updateActiveStatus(verifiersAddr, activeStatus, { from: regOwner });

  return await verifierExists(registry, verifiersAddr) === activeStatus;
}

export {
  registerVerifiers,
  balancesPerShard,
  verifiersPerShard,
  updateActiveStatus,
};
