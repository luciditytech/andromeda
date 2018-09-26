const fs = require('fs');
const Chain = artifacts.require("./Chain.sol");
const VerifierRegistry = artifacts.require('VerifierRegistry');

module.exports = function(deployer, network) {

  let config;

  if (
    network === 'development' ||
    network === 'ropsten' ||
    network === 'coverage' ||
    network === 'ganache'
  ) {
    config = JSON.parse(fs.readFileSync('./config/development.json'));
  } else {
    throw new Error('Security check! Are you sure you want to deploy to live? If so, please comment out this line.');
    // config = JSON.parse(fs.readFileSync('./config/production.json'));
    // wallet = config['wallet'];
  }

  console.log('Deploying to:', network);

  VerifierRegistry.deployed()
    .then(registry => {
      return deployer.deploy(Chain, registry.address, config.Chain.blocksPerPhase);
    })
    .then(chain => {
      console.log('YAY! Chain address:', chain.address);
    })
    .catch(e => {
      console.log(e.message);
    });
};
