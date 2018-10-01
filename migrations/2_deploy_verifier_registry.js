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

    deployer.deploy(
      HumanStandardToken,
      config.HumanStandardToken.total,
      config.HumanStandardToken.name,
      config.HumanStandardToken.decimals,
      config.HumanStandardToken.symbol,
    );
  } else {
    if (network === 'staging') {
      config = JSON.parse(fs.readFileSync('./config/staging.json'));
    } else if (network === 'production') {
      config = JSON.parse(fs.readFileSync('./config/production.json'));
    }

    wallet = config['wallet'];
  }

  deployer.deploy(
    VerifierRegistry,
    config.VerifierRegistry.tokenAddress,
    { from: wallet },
  );
};
