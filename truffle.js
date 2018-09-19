require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
    },
    ropsten: {
      host: '172.31.80.135',
      port: 8545,
      network_id: 1,
      gas: 4600000,
    },
    live: {
      host: '10.0.0.15',
      port: 8545,
      network_id: 1,
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
    },
  },
  mocha: {
    // this option is causing an error: invalid reporter "eth-gas-reporter", when run `npm run test`
    // if you want to see gas usage i.e. when you executing `TestGas.js`, uncomment it
    // reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      gasPrice: 21 // gwei
    }
  }
};
