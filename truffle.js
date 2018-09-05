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
};
