const developmentConfig = require('../config/development');
const stagingConfig = require('../config/staging');
const productionConfig = require('../config/production');

module.exports = (network, accounts) => {
  let config;
  let wallet;
  let options = {};

  if (
    network === 'development'
    || network === 'coverage'
  ) {
    config = developmentConfig;
    wallet = accounts[0];
  } else if (network === 'staging') {
    config = stagingConfig;
    ({ wallet } = config);
  } else if (network === 'production') {
    config = productionConfig;
    ({ wallet } = config);
  }

  if (wallet) {
    options = { from: wallet };
  }

  return {
    options,
    config,
  };
};
