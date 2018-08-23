module.exports = {
  port: 8545,
  norpc: false,
  compileCommand: 'truffle compile --all',
  testCommand: 'truffle test --network coverage',
  skipFiles: ['AbstractChain.sol']
}