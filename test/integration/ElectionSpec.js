const Election = artifacts.require('Election');
const Chain = artifacts.require('Chain');
const Registrations = artifacts.require('Registrations');

import _ from 'lodash';
import BN from 'bn.js';
import sha256 from 'js-sha256';
import HttpProvider from 'ethjs-provider-http';
import EthRPC from 'ethjs-rpc';
import EthQuery from 'ethjs-query';

import SpecHelper from '../SpecHelper.js';
import MetricSetHasher from '../helpers/MetricSetHasher.js';

const ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));
const ethQuery = new EthQuery(new HttpProvider('http://localhost:8545'));

contract('Election', (accounts) => {
  describe('when an election takes place', () => {
    let abstraction;
    let block;
    let root = sha256.hex('root').substring(0, 32);
    let chain;
    let registry;
    let startsAt = 1517196184;
    let endsAt = 1517196184;
    let proposal;

    beforeEach(async () => {
      registry = await Registrations.new();
      chain = await Chain.new();

      await registry
        .create('192.168.1.1');

      block = await ethQuery.blockNumber();
      block = block.add(new BN(1, 10));

      abstraction = await Election.new(
        registry.address,
        chain.address,
        accounts[0],
        block,
        root,
        startsAt,
        endsAt
      );

      await chain.authorize(abstraction.address);
    });

    describe('when valid votes are given', async () => {
      let rows = [
        {
          "campaign_id": sha256.hex("campaign1").substring(0, 32),
          "channel_id": sha256.hex("channel1").substring(0, 32),
          "impressions": 100,
          "clicks": 300,
          "conversions": 500
        },
        {
          "campaign_id": sha256.hex("campaign2").substring(0, 32),
          "channel_id": sha256.hex("channel2").substring(0, 32),
          "impressions": 100,
          "clicks": 300,
          "conversions": 500
        }
      ];

      beforeEach(async () => {
        await SpecHelper.mineBlock(block.add(new BN(1, 10)));

        proposal = MetricSetHasher.call(root, rows);

        await abstraction
          .vote(
            proposal
          );
      });

      describe('when a verifier tries to vote twice', async () => {
        it('should throw an exception', async () => {
          let exception = null;

          try {
            await abstraction
              .vote(
                proposal
              );
          } catch (e) {
            exception = e;
          }

          assert.isDefined(exception);
        });
      });

      describe('when the election is counted', async () => {
        beforeEach(async () => {
          await SpecHelper.mineBlock(block.add(new BN(2, 10)));
        });

        it('should not throw an exception', async () => {
          let res = await abstraction
            .count();

          assert.equal(res.receipt.status, 1);
        });

        describe('when the results are revealed', async () => {
          let campaignIds;
          let channelIds;
          let impressions;
          let clicks;
          let conversions;

          beforeEach(async () => {
            let res = await abstraction
              .count();

            campaignIds = _.map(rows, row => row['campaign_id']);
            channelIds = _.map(rows, row => row['channel_id']);
            impressions = _.map(rows, row => new BN(row['impressions'], 10));
            clicks = _.map(rows, row => new BN(row['clicks'], 10));
            conversions = _.map(rows, row => new BN(row['conversions'], 10));
          });

          it('should not throw an exception', async () => {
            await SpecHelper.mineBlock(block.add(new BN(3, 10)));

            let res = await abstraction
              .reveal(
                campaignIds,
                channelIds,
                impressions,
                clicks,
                conversions
              );

            assert.equal(res.receipt.status, 1);
          });

          it('should mint a new block on the root chain', async () => {
            await SpecHelper.mineBlock(block.add(new BN(3, 10)));

            let res = await abstraction
              .reveal(
                campaignIds,
                channelIds,
                impressions,
                clicks,
                conversions
              );

            let numberOfBlocks = await chain
              .blockNumber
              .call();

            assert(numberOfBlocks.toNumber(), 1);
          });
        });
      });
    });
  });
});
