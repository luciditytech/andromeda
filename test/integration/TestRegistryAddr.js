import Web3Utils from 'web3-utils';

const Chain = artifacts.require('Chain');
const ChainUtil = require('../ministro-contracts/ministroChain');

const ministroChain = ChainUtil();

contract('Chain - testing registryAddress', (accounts) => {/*
  let chainInstance;
  const registryAddr = Web3Utils.randomHex(20);
  const newRegistryAddr = Web3Utils.randomHex(20);

  before(async () => {
    assert.notEqual(registryAddr, newRegistryAddr);
    chainInstance = await Chain.new(registryAddr, 5, 100, true);
    ministroChain.setInstanceVar(chainInstance);
    ministroChain.setFromVar(accounts[0]);
  });

  it('should have valid initial value', async () => {
    assert.strictEqual(await ministroChain.registryAddress(), registryAddr);
  });

  it('should allow owner to change registry address', async () => {
    await ministroChain.updateRegistryAddress(newRegistryAddr);
  });

  it('should NOT allow to change registry address if not from owner', async () => {
    await ministroChain.updateRegistryAddress(newRegistryAddr, { from: accounts[1] }, true);
  });

  it('should NOT allow to change registry to empty address', async () => {
    await ministroChain.updateRegistryAddress('0x0', {}, true);
  });*/
});
