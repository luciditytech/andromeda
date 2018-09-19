import formatVerifier from '../helpers/Verifier';

const fs = require('fs');

const VerifierRegistry = artifacts.require('VerifierRegistry');
const HumanStandardToken = artifacts.require('token-sale-contracts/contracts/HumanStandardToken.sol');

const config = JSON.parse(fs.readFileSync('./config/development.json'));

// @return address of registry
async function registerVerifiers(regOwner, verifiersAddr) {
  const registry = await VerifierRegistry.deployed();
  const humanStandardToken = await HumanStandardToken.deployed();

  await registry.updateTokenAddress(humanStandardToken.address, { from: regOwner });

  const amounts = {};

  try {
    const mapResults = verifiersAddr.map(async (addr) => {
      amounts[addr] = parseInt(Math.random() * 5, 10) + 1;
      await humanStandardToken.transfer(addr, amounts[addr], { from: regOwner });
    });
    await Promise.all(mapResults);
  } catch (e) {
    console.log(e);
    throw new Error('[verifiers registration] transfer fail');
  }

  try {
    const mapResults = verifiersAddr.map(async (addr) => {
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
      mapResults.push(registry.create(`192.168.1.${i + 1}`, { from: addr }));
    });
    await Promise.all(mapResults);
  } catch (e) {
    // verifier is probably registeres if create failing
    // console.log(e);
    // throw new Error('[verifiers registration] create fail');
  }

  try {
    const mapResults = verifiersAddr.map(async (addr) => {
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

module.exports = registerVerifiers;
