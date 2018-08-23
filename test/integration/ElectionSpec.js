// turn off/on console.log messages
const debug = 0;

const rpcProvider = 'http://localhost:8545';

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
import formatVerifier from '../helpers/Verifier';

import samples from '../samples/rows';

const ElectionUtil = require('../proxy-contracts/proxyElection');
const proxyElection = ElectionUtil();


const ethRPC = new EthRPC(new HttpProvider(rpcProvider));
const ethQuery = new EthQuery(new HttpProvider(rpcProvider));

contract('Election', (accounts) => {
  describe('when an election takes place', () => {

    // this will be instance of Election contract
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
    let verifier;

    beforeEach(async () => {
      registry = await VerifierRegistry.new('0x0');
      chain = await Chain.new();

      await registry.create('192.168.1.1');

      let res = await registry.verifiers.call(accounts[0]);
      verifier = formatVerifier.format(res);
      debug && console.log(verifier);

      block = await ethQuery.blockNumber();
      block = block.add(new BN(1, 10));

      abstraction = await Election.new(
        registry.address,
        chain.address,
        block,
        root,
        startsAt,
        endsAt,
        votingTime,
        revealTime
      );

      proxyElection.setInstanceVar(abstraction)
      proxyElection.setFromVar(accounts[0])

      await chain.authorize(proxyElection.instance.address);

    });

    describe('when valid votes are given', async () => {


      beforeEach(async () => {
        proposal = MetricSetHasher.call(root, samples.rows);
        blindedProposal = Hasher.keccak256(proposal, secret);

        await proxyElection.vote(blindedProposal);

      });

      describe('when revealing our proposal', async () => {
        beforeEach(async () => {
          await SpecHelper.moveForward(votingTime + 1);

          await proxyElection.reveal(proposal,secret);
        });


        it('should became a winner, because it is a first and only vote', async () => {

            let winner = await proxyElection.roots(verifier.shard);
            assert.strictEqual(winner, proposal);
        });

        it('should throw an exception when informAboutEnd call before end of election', async () => {
            await proxyElection.informAboutEnd({}, true);
        });


        describe('when the election is over', async () => {
          beforeEach(async () => {
            await SpecHelper.moveForward(revealTime + votingTime + 1);
          });

          it('should not throw an exception when informAboutEnd', async () => {
            await proxyElection.informAboutEnd();
          });

          it('should mint a new side-chain block on the root chain', async () => {
            await SpecHelper.mineBlock(block.add(new BN(3, 10)));

            await proxyElection.informAboutEnd();

            let numberOfBlocks = await chain
              .blockNumber
              .call();

            assert(numberOfBlocks.toNumber(), 1);
          });
        });
      });

      describe('when a verifier tries to vote twice', async () => {
        it('should throw an exception', async () => {

          await proxyElection.vote(proposal, {}, true);

        });
      });
    });
  });
});
