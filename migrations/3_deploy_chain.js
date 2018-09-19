
var Chain = artifacts.require("./Chain.sol");


module.exports = async function(deployer, network, accounts) {

  let accountsNeeded = 3; // 0 as owner and rest (at least 2) as verifiers
  if(accounts.length < accountsNeeded) throw 'we need at least '+ accountsNeeded +' accounts to perform tests';


  if (
    network === 'development' ||
    network === 'ropsten' ||
    network === 'coverage' ||
    network === 'ganache'
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
    config = JSON.parse(fs.readFileSync('./config/production.json'));

    wallet = config['wallet'];
  }

  let registry = await VerifierRegistry.deployed();

  deployer.deploy(Chain, registry.address, config.Chain.blocksPerPhase);

};