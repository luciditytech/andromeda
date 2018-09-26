function blockOfCycle(currentBlock, phaseDuration) {
  return currentBlock % (phaseDuration * 2);
}

function isProposePhase(currentBlock, phaseDuration) {
  return blockOfCycle(currentBlock, phaseDuration) < phaseDuration;
}

function isRevealPhase(currentBlock, phaseDuration) {
  return !isProposePhase(currentBlock, phaseDuration);
}

function blocksToWaitForPropose(currentBlock, phaseDuration) {
  if (isProposePhase(currentBlock, phaseDuration)) return 0;

  return (phaseDuration * 2) - blockOfCycle(currentBlock, phaseDuration);
}

function blocksToWaitForReveal(currentBlock, phaseDuration) {
  if (isRevealPhase(currentBlock, phaseDuration)) return 0;

  return phaseDuration - blockOfCycle(currentBlock, phaseDuration);
}

export {
  blockOfCycle,
  isProposePhase,
  isRevealPhase,
  blocksToWaitForPropose,
  blocksToWaitForReveal,
};
