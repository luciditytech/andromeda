const Registrations = artifacts.require('./Registrations');
const Token = artifacts.require('token-sale-contracts/contracts/Token.sol');
const HumanStandardToken = artifacts.require('token-sale-contracts/contracts/HumanStandardToken.sol');

const fs = require('fs');
const BN = require('bn.js');
const HttpProvider = require('ethjs-provider-http');
const EthRPC = require('ethjs-rpc');
const EthQuery = require('ethjs-query');
const ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));
const ethQuery = new EthQuery(new HttpProvider('http://localhost:8545'));
const SpecHelper = require('../SpecHelper.js');

contract('Registrations', function(accounts) {
  var instance;
  var snapshotId;
  var defaultAccount = accounts[0];
  var conf = JSON.parse(fs.readFileSync('./conf/development.json'));

  beforeEach(function() {
    return SpecHelper.takeSnapshot()
      .then(function(_snapshotId) {
        snapshotId = _snapshotId;

        return Registrations
          .deployed()
          .then(function(_instance) {
            instance = _instance;
          })
      })
  });

  afterEach(function() {
    return SpecHelper.resetSnapshot(snapshotId);
  });

  describe('.add', function() {
    describe('when user does not have enough tokens to register', function() {
      it('does not add the verifier', function(done) {
        instance.add(
          {
            from: defaultAccount
          }
        )
        .catch(function(err) {
          assert.isDefined(err);
          done();
        })
      });
    });

    describe('when the user has enough tokens to register', function() {
      var humanStandardToken;

      beforeEach(function() {
        return HumanStandardToken
          .deployed()
          .then(function(_hst) {
            humanStandardToken = _hst;

            return instance
              .changeTokenAddress(humanStandardToken.address, {
                from: defaultAccount
              })
              .then(function(res) {
                assert.isDefined(res);
              });
          });
      });

      it('adds the verifier', function(done) {
        instance.add(
          {
            from: defaultAccount
          }
        )
        .then(function(res) {
          assert.isDefined(res);
          done();
        });
      });
    });
  });
});
