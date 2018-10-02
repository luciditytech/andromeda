const fs = require('fs');
const VerifierRegistry = artifacts.require('VerifierRegistry');
const HumanStandardToken = artifacts.require('HumanStandardToken');

module.exports = (deployer, network, accounts) => {
  let config;
  let wallet;

  if (
    network === 'development' ||
    network === 'coverage'
  ) {
    config = JSON.parse(fs.readFileSync('./config/development.json'));
    wallet = accounts[0];
    tokenAddress = HumanStandardToken.address;
  } else if (network === 'staging') {
    config = JSON.parse(fs.readFileSync('./config/staging.json'));
    wallet = config['wallet'];
    tokenAddress = config.VerifierRegistry.tokenAddress;
  } else if (network === 'production') {
    config = JSON.parse(fs.readFileSync('./config/production.json'));
    wallet = config['wallet'];
    tokenAddress = config.VerifierRegistry.tokenAddress;
  }

  deployer.deploy(
    VerifierRegistry,
    tokenAddress,
    { from: wallet }
  );
};
