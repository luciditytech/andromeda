import BigNumber from 'bignumber.js';

import { mineUntilPropose, mineUntilReveal } from '../helpers/SpecHelper';
import { registerVerifiers, balancesPerShard } from '../helpers/RegisterVerifiers';

import createProposals from '../samples/proposals';


const Chain = artifacts.require('Chain');

const ChainUtil = require('../ministro-contracts/ministroChain');

const ministroChain = ChainUtil();

const verifiersCount = 9;
const phaseDuration = 5 * verifiersCount;
const requirePercentOfTokens = 70;

let logPropose;
let balanceForShard;

contract('Chain: testing validation of election', (accounts) => {
  let chainInstance;

  const proposalsObj = createProposals(verifiersCount, accounts);
  const {
    verifiersAddr, secrets, proposals, blindedProposals,
  } = proposalsObj;


  beforeEach(async () => {
    const registryAddr = await registerVerifiers(accounts[0], verifiersAddr);

    chainInstance = await Chain.new(
      registryAddr,
      phaseDuration,
      requirePercentOfTokens,
    );

    ministroChain.setInstanceVar(chainInstance);

    await mineUntilReveal(phaseDuration);
  });

  it('minimumStakingTokenPercentage should have valid initial state', async () => {
    assert.isTrue(
      BigNumber(requirePercentOfTokens).eq(await ministroChain.minimumStakingTokenPercentage()),
      'invalid initial value for minimumStakingTokenPercentage',
    );
  });

  it('election should be invalid at begin', async () => {
    assert.isFalse(await ministroChain.isElectionValid(0, 0));
  });

  it('should be able to get current total balance for shard', async () => {
    balanceForShard = await balancesPerShard(0);
    let sum = 0;
    for (let i = 1; i <= verifiersCount; i += 1) {
      sum += i;
    }
    assert.strictEqual(balanceForShard.toString(), sum.toString(), 'invalid token balance');
  });

  describe('when all verifiers made a proposal', async () => {
    beforeEach(async () => {
      await mineUntilPropose(phaseDuration);

      const awaits = [];
      for (let i = 0; i < verifiersCount; i += 1) {
        awaits.push(ministroChain.propose(blindedProposals[i], { from: verifiersAddr[i] }));
      }
      const res = await Promise.all(awaits);
      [logPropose] = res[0].LogPropose;
    });

    it('should return invalid election', async () => {
      assert.isFalse(await ministroChain.isElectionValid(logPropose.blockHeight, logPropose.shard));
    });

    describe('when verifiers reveal', async () => {
      beforeEach(async () => {
        await mineUntilReveal(phaseDuration);
      });

      it('should return information if election was valid', async () => {
        const tokensForShard = await balancesPerShard(logPropose.shard);
        let currentSumOfStakeTokens = 0;


        for (let i = 0; i < verifiersCount; i += 1) {
          // first proposal is invalid/different, so we need to reset counter
          if (i === 1) currentSumOfStakeTokens = 0;

          /* eslint-disable-next-line */
          const { LogUpdateCounters: [res] } = await ministroChain.reveal(
            proposals[i],
            secrets[i],
            { from: verifiersAddr[i] },
          );

          assert.strictEqual(tokensForShard.toString(), res.totalTokenBalanceForShard.toString());

          currentSumOfStakeTokens += res.balance.toNumber();
          /* eslint-disable-next-line */
          const onChainCurrentMax = await ministroChain.getBlockMaxVotes(res.blockHeight, res.shard);

          assert.strictEqual(
            currentSumOfStakeTokens.toString(),
            onChainCurrentMax.toString(),
            `invalid number of stake tokens for verifier ${i}`,
          );

          const percentOfStake = Math.floor((currentSumOfStakeTokens * 100) / tokensForShard);
          const validElection = percentOfStake >= requirePercentOfTokens;

          /* eslint-disable-next-line */
          const isElectionValid = await ministroChain.isElectionValid(
            res.blockHeight,
            res.shard,
          );

          if (validElection) {
            assert(BigNumber(percentOfStake).gte(requirePercentOfTokens), `percentOfStake should be >=, for verifier ${i}`);
          } else {
            assert(BigNumber(percentOfStake).lt(requirePercentOfTokens), `percentOfStake should be <, for verifier ${i}`);
          }
          assert.strictEqual(isElectionValid, validElection, `isElectionValid assert error for verifier ${i}`);
        }
      });
    });
  });
});
