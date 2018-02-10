const fs = require('fs');
const BN = require('bn.js');
const HttpProvider = require('ethjs-provider-http');
const EthRPC = require('ethjs-rpc');
const EthQuery = require('ethjs-query');
const ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));
const ethQuery = new EthQuery(new HttpProvider('http://localhost:8545'));

  var moveForward = function(seconds) {
    return new Promise((resolve, reject) => {
      ethRPC.sendAsync({method: 'evm_increaseTime', params: [seconds]}, function(err, res) {
        if (err !== undefined && err !== null) { 
          reject(err);
        }

        resolve();
      });
    });
  };

  var takeSnapshot = function() {
    return new Promise((resolve, reject) => {
      ethRPC.sendAsync({method: 'evm_snapshot'}, function(err, res) {
        if (err !== undefined && err !== null) { 
          reject(err);
        }

        var id = parseInt(res, 16);
        resolve(id);
      });
    });
  }

  var resetSnapshot = function(id) {
    return new Promise((resolve, reject) => {
      ethRPC.sendAsync({method: 'evm_revert', params: [id]}, function(err) {
        if (err !== undefined && err !== null) { 
          reject(err);
        }

        // console.log(err);
        resolve();
      });
    });
  }

var mineBlock = function(newBlockNumber) {
  return new Promise((resolve, reject) => {
    if (!BN.isBN(newBlockNumber)) {
      return reject('not a valid block number');
    }

    return ethQuery.blockNumber()
      .then(function(blockNumber) {
        if (new BN(blockNumber, 10).lt(newBlockNumber)) {
          console.log('mining: ' + blockNumber);
          ethRPC.sendAsync({
              jsonrpc: "2.0",
              method: "evm_mine",
              id: new BN(blockNumber, 10).add(new BN(1, 10))
            }, function(err) {
            if (err !== undefined && err !== null) { 
              reject(err);
            }

            resolve(mineBlock(newBlockNumber));
          });
        } else {
          resolve();
        }
      });
    });
  }

module.exports.moveForward = moveForward;
module.exports.takeSnapshot = takeSnapshot;
module.exports.resetSnapshot = resetSnapshot;
module.exports.mineBlock = mineBlock;
