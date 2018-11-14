const fs = require('fs');
const Chain = artifacts.require("./Chain.sol");
const VerifierRegistry = artifacts.require('VerifierRegistry');

module.exports = function(deployer, network, accounts) {

  let config;
  let options = {};

  if (
    network === 'development' ||
    network === 'coverage'
  ) {
    config = JSON.parse(fs.readFileSync('./config/development.json'));
    wallet = accounts[0];
  } else if (network === 'staging') {
    config = JSON.parse(fs.readFileSync('./config/staging.json'));
    wallet = config['wallet'];
  } else if (network === 'production') {
    config = JSON.parse(fs.readFileSync('./config/production.json'));
    wallet = config['wallet'];
  }

  var verifierRegistryAddress = (config.Chain.verifierRegistryAddress || VerifierRegistry.address);

  if (wallet) {
    options = { from: wallet };
  }

  deployer.deploy(
    Chain,
    verifierRegistryAddress,
    config.Chain.blocksPerPhase,
    options
  );
};
