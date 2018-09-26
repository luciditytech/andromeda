module.exports = {
  copyPackages: ['zeppelin-solidity', 'pokedex', 'token-sale-contracts'],
  port: 8555,
  norpc: false,
  compileCommand: 'truffle compile --all',
  testCommand: 'truffle test --network coverage',
  skipFiles: ['interface/IChain.sol']
}
