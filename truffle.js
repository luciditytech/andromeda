require('babel-register');
require('babel-polyfill');

require('dotenv').config();


const HDWalletProvider = require('truffle-hdwallet-provider');
const Wallet = require('ethereumjs-wallet');
const WalletProvider = require('truffle-wallet-provider');


let ropstenProvider;

if (process.env.DEPLOY_DEV === 'true') {
  ropstenProvider = null;
} else if (typeof process.env.ROPSTEN_MNEMONIC !== 'undefined') {
  ropstenProvider = new HDWalletProvider(
    process.env.ROPSTEN_MNEMONIC,
    `https://ropsten.infura.io/v3/${process.env.INFURA_ACCESS_TOKEN}`,
  );
} else if (typeof process.env.ROPSTEN_PK !== 'undefined') {
  const ropstenPK = Buffer.from(process.env.ROPSTEN_PK, 'hex');
  const ropstenWallet = Wallet.fromPrivateKey(ropstenPK);
  ropstenProvider = new WalletProvider(
    ropstenWallet,
    `https://ropsten.infura.io/v3/${process.env.INFURA_ACCESS_TOKEN}`,
  );
}


module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
      websockets: true,
    },
    staging: {
      provider: ropstenProvider,
      network_id: 3,
    },
    production: {
      provider: ropstenProvider,
      network_id: 3,
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
  },
  mocha: {
    // this option is causing an error: invalid reporter "eth-gas-reporter", when run `npm run test`
    // if you want to see gas usage i.e. when you executing `TestGas.js`, uncomment it
    // reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      gasPrice: 21, // gwei
    },
  },
};
