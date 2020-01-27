function blockOfCycle(currentBlock, cycleDuration) {
  return currentBlock % cycleDuration;
}

function isProposePhase(currentBlock, proposePhaseDuration, revealPhaseDuration) {
  const cycleBlock = blockOfCycle(currentBlock, proposePhaseDuration + revealPhaseDuration);
  return cycleBlock < proposePhaseDuration;
}

function isRevealPhase(currentBlock, proposePhaseDuration, revealPhaseDuration) {
  return !isProposePhase(currentBlock, proposePhaseDuration, revealPhaseDuration);
}

function blocksToWaitForPropose(currentBlock, proposePhaseDuration, revealPhaseDuration) {
  if (isProposePhase(currentBlock, proposePhaseDuration, revealPhaseDuration)) return 0;

  // +1 because we want to be in first block in a phase
  return (proposePhaseDuration + revealPhaseDuration + 1) -
    blockOfCycle(currentBlock, proposePhaseDuration + revealPhaseDuration);
}

function blocksToWaitForReveal(currentBlock, proposePhaseDuration, revealPhaseDuration) {
  if (isRevealPhase(currentBlock, proposePhaseDuration, revealPhaseDuration)) return 0;

  return proposePhaseDuration -
    blockOfCycle(currentBlock, proposePhaseDuration + revealPhaseDuration);
}

export {
  blockOfCycle,
  isProposePhase,
  isRevealPhase,
  blocksToWaitForPropose,
  blocksToWaitForReveal,
};
