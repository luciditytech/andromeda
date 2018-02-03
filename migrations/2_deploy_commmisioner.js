var Commissioner = artifacts.require("./Commissioner.sol");

module.exports = function(deployer) {
  deployer.deploy(Commissioner);
};
