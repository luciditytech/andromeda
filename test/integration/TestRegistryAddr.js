import Web3Utils from 'web3-utils';

const Chain = artifacts.require('Chain');
const ChainUtil = require('../proxy-contracts/proxyChain');

const proxyChain = ChainUtil();

contract('Chain - testing registryAddress', (accounts) => {
  let chainInstance;
  const registryAddr = Web3Utils.randomHex(20);
  const newRegistryAddr = Web3Utils.randomHex(20);

  beforeEach(async () => {
    assert.notEqual(registryAddr, newRegistryAddr);
    chainInstance = await Chain.new(registryAddr, 5);
    proxyChain.setInstanceVar(chainInstance);
    proxyChain.setFromVar(accounts[0]);
  });

  it('should have valid initial value', async () => {
    assert.strictEqual(await proxyChain.registryAddress(), registryAddr);
  });

  it('should allow owner to change registry address', async () => {
    await proxyChain.updateRegistryAddress(newRegistryAddr);
  });

  it('should NOT allow to change registry address if not from owner', async () => {
    await proxyChain.updateRegistryAddress(newRegistryAddr, { from: accounts[1] }, true);
  });

  it('should NOT allow to change registry to empty address', async () => {
    await proxyChain.updateRegistryAddress('0x0', {}, true);
  });
});
