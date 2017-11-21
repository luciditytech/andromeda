var Registrations = artifacts.require("./Registrations.sol");
var HumanStandardToken = artifacts.require('token-sale-contracts/contracts/HumanStandardToken.sol');

const fs = require('fs');

module.exports = function(deployer, network, accounts) {
  var conf;
  var wallet;

  if (network === 'development' || network === 'ropsten') {
    conf = JSON.parse(fs.readFileSync('./conf/development.json'));
    wallet = accounts[0];
  } else {
    conf = JSON.parse(fs.readFileSync('./conf/production.json'));
    wallet = conf['wallet'];
  }

  deployer.deploy(Registrations);

  deployer.deploy(
    HumanStandardToken,
    conf['total'],
    conf['name'],
    conf['decimals'],
    conf['symbol']
  );
};
