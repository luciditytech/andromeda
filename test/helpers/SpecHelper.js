import BigNumber from 'bignumber.js';
import { blocksToWaitForPropose, blocksToWaitForReveal } from './CycleFunctions';

web3.providers.HttpProvider.prototype.sendAsync = web3.providers.HttpProvider.prototype.send;
const httpProvider = new web3.providers.HttpProvider(web3.currentProvider.host);

const moveChar = () => {
  const rand = parseInt(Math.random() * 10, 10) % 4;
  switch (rand) {
    case 0: return '|';
    case 1: return '/';
    case 2: return '-';
    case 3: return '\\';
    default: return rand;
  }
};

const writeProcessMsg = (msg, useMoveChar = true) => {
  const lineLength = 118;
  const s = useMoveChar ? msg + moveChar() : msg;
  const spaces = lineLength - s.length > 0 ? ' '.repeat(lineLength - s.length) : '';
  process.stderr.write(`${s}${spaces}\r`);
};

const advanceBlock = () => (
  new Promise((resolve, reject) => {
    writeProcessMsg('mining blocks... ');
    httpProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: Date.now(),
    }, (err, res) => (err ? reject(err) : resolve(res)));
  })
);

const advanceToBlock = async (number) => {
  const blockNumber = await web3.eth.getBlockNumber();
  if (blockNumber > number) {
    throw Error(`block number ${number} is in the past (current is ${blockNumber})`);
  } else if (blockNumber === number) {
    return Promise.resolve();
  }

  const awaits = [];

  const blockCount = number - blockNumber;

  Array(blockCount)
    .fill()
    .forEach(() => awaits.push(advanceBlock()));

  return Promise.all(awaits);
};

const mineUntilPropose = async (proposePhaseDuration, revealPhaseDuration) => {
  const blockNumber = await web3.eth.getBlockNumber();

  const toMine =
    blocksToWaitForPropose(blockNumber, proposePhaseDuration, revealPhaseDuration);

  const prosalStartBlockNumber = new BigNumber(blockNumber).plus(toMine);

  await advanceToBlock(prosalStartBlockNumber.toNumber());
};

const mineUntilReveal = async (proposePhaseDuration, revealPhaseDuration) => {
  const blockNumber = await web3.eth.getBlockNumber();

  const toMine =
    blocksToWaitForReveal(blockNumber, proposePhaseDuration, revealPhaseDuration);

  const revealStartBlockNumber = new BigNumber(blockNumber).plus(toMine);
  await advanceToBlock(revealStartBlockNumber.toNumber());
};

const getBlockHeight = async (proposePhaseDuration, revealPhaseDuration) => {
  const blockNumber = await web3.eth.getBlockNumber();

  return BigNumber(blockNumber)
    .div(parseInt(proposePhaseDuration, 10) + parseInt(revealPhaseDuration, 10), 10)
    .toString(10)
    .split('.')[0];
};

export {
  writeProcessMsg,
  mineUntilReveal,
  mineUntilPropose,
  getBlockHeight,
};
