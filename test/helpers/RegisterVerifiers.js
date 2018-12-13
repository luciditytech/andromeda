import formatVerifier from '../helpers/Verifier';

const fs = require('fs');

const VerifierRegistry = artifacts.require('VerifierRegistry');
const HumanStandardToken = artifacts.require('token-sale-contracts/contracts/HumanStandardToken.sol');

const config = JSON.parse(fs.readFileSync('./config/development.json'));


async function balancesPerShard(shard) {
  const registry = await VerifierRegistry.deployed();
  const res = await registry.balancesPerShard.call(shard.toString());
  return res.toString();
}

async function verifiersPerShard() {
  const registry = await VerifierRegistry.deployed();
  const res = await registry.verifiersPerShard.call();
  return res.toString();
}


async function verifierExists(addr) {
  const registry = await VerifierRegistry.deployed();
  let res = await registry.verifiers.call(addr);
  res = formatVerifier.format(res);
  return res.created;
}

// @return address of registry
async function registerVerifiers(regOwner, verifiersAddr) {
  const registry = await VerifierRegistry.deployed();
  const humanStandardToken = await HumanStandardToken.deployed();

  await registry.updateTokenAddress(humanStandardToken.address, { from: regOwner });

  const amounts = {};

  try {
    const mapResults = verifiersAddr.map(async (addr, i) => {
      if (await verifierExists(addr)) return;
      amounts[addr] = i + 1;
      await humanStandardToken.transfer(addr, amounts[addr], { from: regOwner });
    });
    await Promise.all(mapResults);
  } catch (e) {
    console.log(e);
    throw new Error('[verifiers registration] transfer fail');
  }

  try {
    const mapResults = verifiersAddr.map(async (addr) => {
      if (!amounts[addr]) return;
      await humanStandardToken.approve(registry.address, amounts[addr], { from: addr });
    });
    await Promise.all(mapResults);
  } catch (e) {
    console.log(e);
    throw new Error('[verifiers registration] approve fail');
  }


  try {
    const mapResults = [];
    verifiersAddr.map(async (addr, i) => {
      if (!amounts[addr]) return;
      mapResults.push(registry.create(`192.168.1.${i + 1}`, { from: addr }));
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
      await registry.receiveApproval(addr, 0, config.VerifierRegistry.tokenAddress, '');
    });
    await Promise.all(mapResults);
  } catch (e) {
    console.log(e);
    throw new Error('[verifiers registration] receiveApproval fail');
  }


  const mapResults = verifiersAddr.map(async (addr) => {
    let res = await registry.verifiers.call(addr);
    res = formatVerifier.format(res);
    assert.isTrue(res.created, 'verifier is not in registry');
    assert.notEqual(parseInt(res.balance, 10), 0, 'verifier must have balance');
  });
  await Promise.all(mapResults);


  return registry.address;
}

export {
  registerVerifiers,
  balancesPerShard,
  verifiersPerShard,
};
