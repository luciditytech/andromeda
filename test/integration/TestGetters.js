import { mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';
import { registerVerifiers } from '../helpers/RegisterVerifiers';
import createProposals from '../samples/proposals';

const Chain = artifacts.require('Chain');

const ChainUtil = require('../ministro-contracts/ministroChain');

const ministroChain = ChainUtil();

contract('Chain - testing getters', (accounts) => {
  const phaseDuration = 5;
  const verifiersCount = 1;
  const requirePercentOfTokens = 70;

  let chainInstance;

  const {
    verifiersAddr,
    secrets,
    proposals,
    blindedProposals,
  } = createProposals(verifiersCount, accounts);

  before(async () => {
    const registryAddr = await registerVerifiers(accounts[0], verifiersAddr);

    chainInstance = await Chain.new(
      registryAddr,
      phaseDuration,
      requirePercentOfTokens,
      true,
    );

    ministroChain.setInstanceVar(chainInstance);
  });

  describe('when verifier propose and reveal', async () => {
    let results;

    let sender;
    let blockHeight;
    let proposal;
    let shard;
    let balance;

    before(async () => {
      await mineUntilReveal(phaseDuration);
      await mineUntilPropose(phaseDuration);


      await ministroChain.propose(blindedProposals[0], { from: verifiersAddr[0] });
      await mineUntilReveal(phaseDuration);
      results = await ministroChain.reveal(proposals[0], secrets[0], { from: verifiersAddr[0] });


      ({ sender, blockHeight, proposal } = results.LogReveal[0]);
      ({ shard, balance } = results.LogUpdateCounters[0]);

      blockHeight = blockHeight.toString(10);
      shard = shard.toString(10);
      balance = balance.toString(10);
    });

    it('should be possible to get winning root', async () => {
      assert.strictEqual(await ministroChain.getBlockRoot(blockHeight, shard), proposal);
    });

    it('should be possible to get voter information', async () => {
      const voter = await ministroChain.getBlockVoter(blockHeight, sender);

      assert.strictEqual(voter.blindedProposal, blindedProposals[0]);
      assert.strictEqual(voter.shard, shard);
      assert.strictEqual(voter.proposal, proposals[0]);
    });

    it('should be possible to get max Votes information', async () => {
      const maxVotes = await ministroChain.getBlockMaxVotes(blockHeight, shard);
      assert.strictEqual(maxVotes.toString(10), balance);
    });

    it('should be possible to get count information', async () => {
      const count = await ministroChain.getBlockCount(blockHeight, shard, proposals[0]);
      assert.strictEqual(balance, count.toString(10));
    });

    it('should be possible to read verifier addresses', async () => {
      const addrsCount = await ministroChain.getBlockAddressCount(blockHeight);
      assert.strictEqual(addrsCount.toString(10), '1');

      const addr = await ministroChain.getBlockAddress(blockHeight, 0);
      assert.strictEqual(addr, verifiersAddr[0]);
    });
  });
});
