var Registrations = artifacts.require("./Registrations.sol");
const fs = require('fs');

module.exports = function(deployer, network, accounts) {
  var conf;
  var wallet;

  if (network === 'development') {
    conf = JSON.parse(fs.readFileSync('./conf/development.json'));
    wallet = accounts[0];
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
};
