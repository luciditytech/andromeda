const Election = artifacts.require('Election');
const Chain = artifacts.require('Chain');
const VerifierRegistry = artifacts.require('VerifierRegistry');

import _ from 'lodash';
import BN from 'bn.js';
import sha256 from 'js-sha256';
import HttpProvider from 'ethjs-provider-http';
import EthRPC from 'ethjs-rpc';
import EthQuery from 'ethjs-query';

import SpecHelper from '../SpecHelper.js';
import MetricSetHasher from '../helpers/MetricSetHasher.js';
import Hasher from '../helpers/Hasher.js';

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
    let votingTime = 120;
    let revealTime = 120;
    let proposal;
    let blindedProposal;
    let secret = Hasher.keccak256(sha256.hex('secret'));

    beforeEach(async () => {
      registry = await VerifierRegistry.new('0x0');
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
        endsAt,
        votingTime,
        revealTime
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
        proposal = MetricSetHasher.call(root, rows);
        blindedProposal = Hasher.keccak256(proposal, secret);

        await abstraction
          .vote(
            blindedProposal
          );
      });

      it('should have submitted the expected proposal', async () => {
        let voter = await abstraction.voters.call(accounts[0]);
        let storedBlindedProposal = voter[1];
        assert.equal(blindedProposal, storedBlindedProposal);
      });

      describe('when revealing our proposal', async () => {
        beforeEach(async () => {
          await SpecHelper.moveForward(votingTime + 1);

          await abstraction
            .reveal(
              proposal,
              secret
            );
        });

        describe('when the election is counted', async () => {
          beforeEach(async () => {
            await SpecHelper.moveForward(revealTime + votingTime + 1);
          });

          it('should not throw an exception', async () => {
            let res = await abstraction
              .count();

            assert.equal(res.receipt.status, 1);
          });

          it('should mint a new side-chain block on the root chain', async () => {
            await SpecHelper.mineBlock(block.add(new BN(3, 10)));

            let res = await abstraction
              .count();

            let numberOfBlocks = await chain
              .blockNumber
              .call();

            assert(numberOfBlocks.toNumber(), 1);
          });
        });
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
    });
  });
});
