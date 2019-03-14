const BigNumber = require('bignumber.js');

function getNextProposeStartBlock(currentBlockNumber, phaseDuration) {
  const cycle = BigNumber(phaseDuration).times(2);
  const cycleBlock = BigNumber(currentBlockNumber).mod(cycle);
  return BigNumber(cycle).minus(cycleBlock).mod(cycle).plus(currentBlockNumber);
}

function getNextRevealStartBlock(currentBlockNumber, phaseDuration) {
  return BigNumber(getNextProposeStartBlock(currentBlockNumber, phaseDuration)).plus(phaseDuration);
}

module.exports = {
  getNextProposeStartBlock,
  getNextRevealStartBlock,
};
