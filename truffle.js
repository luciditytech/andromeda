require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    ropsten: {
      host: '172.31.80.135',
      port: 8545,
      network_id: 1,
      gas: 4600000
    },
    live: {
      host: '10.0.0.15',
      port: 8545,
      network_id: 1
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8545,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    },
  }
};
