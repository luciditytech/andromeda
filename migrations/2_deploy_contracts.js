var Registrations = artifacts.require("./Registrations.sol");
var Checkpoints = artifacts.require("./Checkpoints.sol");
var HumanStandardToken = artifacts.require('token-sale-contracts/contracts/HumanStandardToken.sol');

const fs = require('fs');

module.exports = function(deployer, network, accounts) {
  var conf;
  var wallet;

  if (network === 'development') {
    conf = JSON.parse(fs.readFileSync('./conf/development.json'));
    wallet = accounts[0];

    deployer.deploy(
      HumanStandardToken,
      conf['total'],
      conf['name'],
      conf['decimals'],
      conf['symbol'],
      {
        from: accounts[1]
      }
    );
  } else if (network === 'ropsten') {
    conf = JSON.parse(fs.readFileSync('./conf/development.json'));
    wallet = accounts[0];
  } else {
    conf = JSON.parse(fs.readFileSync('./conf/production.json'));
    wallet = conf['wallet'];
  }

  deployer.deploy(Registrations, {
    from: wallet
  });

  deployer.deploy(Checkpoints, {
    from: wallet
  });
};
