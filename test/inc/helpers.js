const BN = require('bn.js');
const BigNumber = require('bignumber.js');

const HttpProvider = require('ethjs-provider-http');
const EthRPC = require('ethjs-rpc');
const EthQuery = require('ethjs-query');

const ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));
const ethQuery = new EthQuery(new HttpProvider('http://localhost:8545'));

const ethBlockNumber = async () => ethQuery.blockNumber();

const toBigNumber = (v) => {
  if (BN.isBN(v)) {
    return BigNumber(v.toString(10), 10);
  }
  if (BigNumber.isBigNumber(v)) {
    return v;
  }
  return v;
};

const moveForward = seconds => new Promise((resolve, reject) => {
  ethRPC.sendAsync({ method: 'evm_increaseTime', params: [seconds] }, (err) => {
    if (err !== undefined && err !== null) {
      reject(err);
    }

    resolve();
  });
});

const takeSnapshot = () => new Promise((resolve, reject) => {
  ethRPC.sendAsync({ method: 'evm_snapshot' }, (err, res) => {
    if (err !== undefined && err !== null) {
      reject(err);
    }

    const id = parseInt(res, 16);
    resolve(id);
  });
});

const resetSnapshot = id => new Promise((resolve, reject) => {
  ethRPC.sendAsync({ method: 'evm_revert', params: [id] }, (err) => {
    if (err !== undefined && err !== null) {
      reject(err);
    }
    // console.log(err);
    resolve();
  });
});

const mineBlock = newBlockNumber => new Promise((resolve, reject) => ethQuery.blockNumber()
  .then((blockNumber) => {
    if (BigNumber(blockNumber).lt(toBigNumber(newBlockNumber))) {
      ethRPC.sendAsync({ jsonrpc: '2.0', method: 'evm_mine' }, (err) => {
        if (err !== undefined && err !== null) {
          reject(err);
        }

        resolve(mineBlock(newBlockNumber));
      });
    } else {
      resolve();
    }
  }));

module.exports = {
  moveForward,
  takeSnapshot,
  resetSnapshot,
  mineBlock,
  ethBlockNumber,
};
