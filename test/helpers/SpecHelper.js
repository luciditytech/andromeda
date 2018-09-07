import BN from 'bn.js';
import EthQuery from 'ethjs-query';
import web3Utils from 'web3-utils';

const ethQuery = new EthQuery(web3.currentProvider);

const moveForward = seconds => (
  new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({ method: 'evm_increaseTime', params: [seconds] }, (err) => {
      if (err !== undefined && err !== null) {
        reject(err);
      }
      resolve();
    });
  })
);

const takeSnapshot = () => (
  new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({ method: 'evm_snapshot' }, (err, res) => {
      if (err !== undefined && err !== null) {
        reject(err);
      }

      const id = parseInt(res, 16);
      resolve(id);
    });
  })
);

const resetSnapshot = id => (
  new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({ method: 'evm_revert', params: [id] }, (err) => {
      if (err !== undefined && err !== null) {
        reject(err);
      }

      resolve();
    });
  })
);

const mineBlock = newBlockNumber => (
  new Promise((resolve, reject) => {
    if (!web3Utils.isBN(newBlockNumber)) {
      return reject(new Error('not a valid block number'));
    }

    return ethQuery.blockNumber()
      .then((blockNumber) => {
        if (new BN(blockNumber, 10).lt(newBlockNumber)) {
          console.log(`mining: ${blockNumber}`);

          web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_mine',
            id: new BN(blockNumber, 10).add(new BN(1, 10)),
          }, (err) => {
            if (err !== undefined && err !== null) {
              return reject(err);
            }

            return resolve(mineBlock(newBlockNumber));
          });
        }

        return resolve();
      });
  })
);

export {
  moveForward,
  takeSnapshot,
  resetSnapshot,
  mineBlock,
};
