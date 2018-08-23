import Web3 from 'web3';
import leftPad from 'left-pad';
import { isString, isNumber, forEach } from 'lodash';
import Hasher from './Hasher.js';

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

function call(root, rows) {
  var hash = Hasher.keccak256(root);

  _.forEach(rows, (row) => {
    hash = Hasher.keccak256(
      hash,
      row['campaign_id'],
      row['channel_id'],
      row['impressions'],
      row['clicks'],
      row['conversions']
    );
  });

  return hash;
};

module.exports.call = call;
