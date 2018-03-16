import Web3 from 'web3';
import leftPad from 'left-pad';
import { isString, isNumber, forEach } from 'lodash';

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

function keccak256(...args) {
  var hexStart = '0x';

  args = args.map(arg => {
    if (isString(arg)) {
      if (arg.substring(0, 2) === hexStart) {
          return arg.slice(2)
      } else {
          return web3.toHex(arg).slice(2)
      }
    }

    if (isNumber(arg)) {
      return leftPad((arg).toString(16), 64, 0)
    } else {
      return ''
    }
  });

  args = args.join('');

  return web3.sha3(args, {encoding: 'hex'});
}

module.exports.keccak256 = keccak256;
