import chai from 'chai';
import web3Utils from 'web3-utils';
import ministroExecute from 'ministro-tool';
import BigNumber from 'bignumber.js';

const { assert } = chai;

function ProxyContract() {
  const app = {};

  // internal variable, might be helpful while testing
  app.shard = {};

  /* eslint-disable-next-line */
  app.__proto__ = ministroExecute();

  app.createProof = async (proposal, secret) => {
    assert.strictEqual(proposal.length, 66);
    assert.notEmpty(secret);
    return app.instance.createProof.call(proposal, secret);
  };

  app.propose = async (blindedProposal, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);
    const action = () => app.instance.propose(blindedProposal, txAttrLocal);

    const results = await app.executeAction(action, txAttrLocal, null, 'LogPropose', expectThrow);

    if (!expectThrow) {
      assert.exists(results.LogPropose, 'missing LogPropose event');
      const logPropose = results.LogPropose[0];

      assert.strictEqual(logPropose.sender, txAttrLocal.from, 'invalid sender');
      assert.strictEqual(logPropose.blindedProposal, blindedProposal, 'invalid blindedProposal');
      assert.isNotEmpty(logPropose.shard.toString(10), 'invalid shard');

      const vote = await app.getBlockVoter(logPropose.blockHeight, txAttrLocal.from);
      assert.strictEqual(vote.blindedProposal.toString(10), blindedProposal, 'vote is not saved on blockchain');
      assert.strictEqual(vote.shard, logPropose.shard.toString(10), 'blockchain vote has invalid shard number');

      // save shard value, so we can us it in reveal tests
      app.shard[logPropose.blockHeight.toString(10) + blindedProposal] = vote.shard;
    }

    return results;
  };

  // @param _proposal bytes32
  // @param _secret bytes32
  app.reveal = async (proposal, secret, txAttr, expectThrow) => {
    let blindedProposal;

    if (!expectThrow) {
      blindedProposal = web3Utils.soliditySha3(proposal, secret);
    }

    const txAttrLocal = app.getTxAttr(txAttr);

    const action = () => app.instance.reveal(proposal, secret, txAttrLocal);

    const results = await app.executeAction(action, txAttrLocal, null, null, expectThrow);

    if (!expectThrow) {
      assert.exists(results.LogReveal, 'missing LogReveal event');
      assert.exists(results.LogReveal.length, 1, 'it should be only one LogReveal event');
      const logReveal = results.LogReveal[0];

      assert.exists(results.LogUpdateCounters, 'missing LogUpdateCounters event');
      assert.exists(results.LogUpdateCounters.length, 1, 'it should be only one LogUpdateCounters event');

      const logUpdateCounters = results.LogUpdateCounters[0];
      assert.notEqual(logUpdateCounters.counts.toString(10), '0', 'counts can not be zero');
      assert.isTrue(BigNumber(logUpdateCounters.totalTokenBalanceForShard).gt(0), 'totalTokenBalanceForShard must be gt zero');

      const voter = await app.getBlockVoter(logReveal.blockHeight, txAttrLocal.from);


      assert.strictEqual(logReveal.sender, txAttrLocal.from, 'invalid sender');
      assert.strictEqual(logReveal.proposal, proposal, 'invalid proposal');

      // if we have shard from proposal, we can test it
      if (typeof app.shard[logReveal.blockNumber + blindedProposal] !== 'undefined') {
        const shard = app.shard[logReveal.blockNumber + blindedProposal];
        assert.strictEqual(logUpdateCounters.shard.toString(10), shard, 'base on cached value, shard in invalid');
        assert.strictEqual(voter.shard, shard, 'shard is invalid');
      }

      const stateTokens = await app.getStakeTokenBalanceFor(
        logUpdateCounters.blockHeight,
        logUpdateCounters.shard,
      );
      assert.isTrue(BigNumber(logUpdateCounters.totalTokenBalanceForShard).eq(stateTokens), 'invalid state tokens value');


      assert.strictEqual(logUpdateCounters.proposal, proposal, 'invalid proposal');
      assert.strictEqual(voter.proposal, proposal, 'proposal is not saved on blockchain');
    }

    return results;
  };

  app.updateRegistryAddress = async (registryAddress, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);

    const action = () => app.instance.updateRegistryAddress(registryAddress, txAttrLocal);

    const results = await app.executeAction(action, txAttrLocal, 1, 'LogUpdateRegistryAddress', expectThrow);

    if (!expectThrow) {
      const logUpdateRegistryAddress = results.LogUpdateRegistryAddress[0];
      assert.strictEqual(logUpdateRegistryAddress.newRegistryAddress, registryAddress, 'invalid newRegistryAddress');

      const registry = await app.registryAddress();
      assert.strictEqual(registry, registryAddress, 'registryAddress is not saved on blockchain');
    }

    return results;
  };

  app.updateMinimumStakingTokenPercentage = async (percent, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);

    const action = () => app.instance.updateMinimumStakingTokenPercentage(percent, txAttrLocal);

    const results = await app.executeAction(action, txAttrLocal, 1, 'LogChainConfig', expectThrow);

    if (!expectThrow) {
      const logChainConfig = results.LogChainConfig[0];
      assert.strictEqual(logChainConfig.requirePercentOfTokens.toString(), percent.toString(), 'invalid minimumStakingTokenPercentage');

      const minimumStakingTokenPercentage = await app.minimumStakingTokenPercentage();
      assert.strictEqual(minimumStakingTokenPercentage.toString(), percent.toString(), 'minimumStakingTokenPercentage is not saved on blockchain');
    }

    return results;
  };

  app.getBlockVoter = async (blockHeight, address) => {
    assert.isNotEmpty(address);
    const res = await app.instance.getBlockVoter(blockHeight, address);

    return {
      blindedProposal: res[0],
      shard: res[1].toString(10),
      proposal: res[2],
      balance: res[3].toString(10),
    };
  };

  app.getBlockHeight = async () => app.instance.getBlockHeight.call();
  app.getCycleBlock = async () => app.instance.getCycleBlock.call();
  app.getFirstCycleBlock = async () => app.instance.getFirstCycleBlock.call();
  app.registryAddress = async () => app.instance.registryAddress.call();

  app.getBlockAddressCount =
    async blockHeight => app.instance.getBlockAddressCount.call(blockHeight);

  app.getBlockAddress =
    async (blockHeight, i) => app.instance.getBlockAddress.call(blockHeight, i);

  app.getBlockMaxVotes = async (blockHeight, shard) =>
    app.instance.getBlockMaxVotes.call(blockHeight.toString(), shard.toString());

  app.getBlockCount = async (blockHeight, shard, proposal) =>
    app.instance.getBlockCount.call(blockHeight, shard, proposal);

  app.getBlockRoot =
    async (blockHeight, shard) => app.instance.getBlockRoot.call(blockHeight, shard);

  app.minimumStakingTokenPercentage = async () => app.instance.minimumStakingTokenPercentage.call();

  app.getStakeTokenBalanceFor =
    async (blockHeight, shard) => app.instance.getStakeTokenBalanceFor.call(
      blockHeight.toString(),
      shard.toString(),
    );

  app.isElectionValid = async (blockHeight, shard) => app.instance.isElectionValid.call(
    blockHeight.toString(),
    shard.toString(),
  );

  return app;
}

module.exports = ProxyContract;
