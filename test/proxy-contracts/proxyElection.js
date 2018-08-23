'use strict'

let debug = 0

let chai = require('chai')
let assert = chai.assert
const createKeccakHash = require('keccak')
const proxyExecute = require('../proxy-utils/proxyExecute.js')

/**
 * What ProxyContract is for?
 *
 * When you tests proxy-contracts you have a lot of repeated code like:
 * `await instance.foo()`
 * `assert.isOK(foo)`
 *
 * Once you tested your `foo()` in once scenario, in most cases you not checking it next time you using `foo()` in some
 * other scenario... and this is not good.
 * ProxyContract allow you to write assert conditions once and using them in each case scenario with just one line.
 *
 * Thanks to this, your tests are very very strong, easy to understand and you have clean short code.
 *
 * Basically this proxy contract must reflect all methods that real contract has.
 * Whats more - each method must have all possible test you can perform base ONLY (!) on input and output data.
 * You also must cover scenario when method throw (if this is a case).
 *
 * When you do all that, you just execute a method on proxy contract and ech time you do it in your tests,
 * all tests are done.
 *
 * There are also some additional helper mechanisms here like:
 * - create default transaction object,
 * - checking is transaction was successful
 * - read events for transaction
 *
 * Each method must have:
 * - parameters that are equal to instance method (required)
 * - object with transaction parameters (optional)
 * - variable that inform us, if this execution is expected to throw (optional)
 *
 * Please review the code - its pretty simple, so you should be able to understand how to use it very quickly
 *
 * How to use include it in tests? first create variables:
 *
 * const Util = require('./proxy-contracts/proxyContract')
 * const Artifacts = artifacts.require('./Contract.sol')
 * const Contract = Util()
 *
 * then when you want to use it:
 *
 * let instance = await Artifacts.new()
 * Contract.setInstanceVar(instance)
 * Contract.setFromVar(accounts[0])
 *
 * finaly fire a method:
 *
 * Contract.foo()
 *
 * and this one line will perform all test you created in proxy.
 *
 * Note: this test might not be enough for each cases, if some external data are present and proxy contract do not have
 * access to them, you need to check them directly in test file. DO NOT modify proxy by adding additional params
 * to the method, because this is not how it should work. Proxy test should be the same for ALL cases and they should
 * work the same each time so anybody can use it in any scenario and worry abut your special case.
 *
 * @author Dariusz Zacharczuk
 *
 */
function ProxyContract () {

  let app = {}

  // internal variable, might be helpfull while testing
  app._shard = {}

  app.__proto__ = proxyExecute()


  app.vote = async (_blindedProposal, _txAttr, _expectThrow) => {

    _txAttr = app.getTxAttr(_txAttr)

    // create action command
    let action = () => app.instance.vote(_blindedProposal, _txAttr)

    // run `executeAction` - pay attention on additional attributes like: logCount, eventName, expectThrow
    // do not create this variable globally
    let results = await app.executeAction(action, _txAttr, 1, 'LogVote', _expectThrow)

    //  perform tests
    if (!_expectThrow) {

      assert.exists(results.LogVote, 'missing LogVote event')
      let logVote = results.LogVote[0]

      assert.strictEqual(logVote.sender, _txAttr.from, 'invalid sender')
      assert.strictEqual(logVote.blindedProposal, _blindedProposal, 'invalid blindedProposal')
      assert.isNotEmpty(logVote.shard.toString(10), 'invalid shard')

      let voter = await app.voters(_txAttr.from);
      assert.strictEqual(voter.blindedProposal, _blindedProposal, 'invalid blindedProposal');

      // save shard value, so we can us it in reveal tests
      app._shard[_blindedProposal] = logVote.shard.toString(10)
    }

    return results
  }

  // @param _proposal bytes32
  // @param _secret bytes32
  app.reveal = async (_proposal, _secret, _txAttr, _expectThrow) => {

    let prevCounts
    let prevRoots
    let blindedProposal

    if (!_expectThrow) {

      // we expect that this transaction will succeed, so lets read current values from blockchain,
      // so we can compare after transaction

      blindedProposal = createKeccakHash('keccak256').update(_proposal + _secret).digest('hex')
      let shard = app._shard[blindedProposal] || null
      prevCounts = shard ? await app.counts(shard, _proposal) : null
      prevRoots = shard ? await app.roots(shard) : null
    }

    _txAttr = app.getTxAttr(_txAttr)

    // create action command
    let action = () => app.instance.reveal(_proposal, _secret, _txAttr)

    // run `executeAction` - pay attention on additional attributes like: logCount, eventName, expectThrow
    // do not create this variable globally
    let results = await app.executeAction(action, _txAttr, null, null, _expectThrow)

    //  perform tests
    if (!_expectThrow) {

      // first lets check if we have all expected events

      assert.exists(results.LogReveal, 'missing LogReveal event')
      assert.exists(results.LogReveal.length, 1, 'it should be only one LogReveal event')
      let logReveal = results.LogReveal[0]

      assert.exists(results.LogUpdateCounters, 'missing LogUpdateCounters event')
      assert.exists(results.LogUpdateCounters.length, 1, 'it should be only one LogUpdateCounters event')
      let logUpdateCounters = results.LogUpdateCounters[0]

      // now we can move to checking values

      assert.strictEqual(logReveal.sender, _txAttr.from, 'invalid sender')
      assert.strictEqual(logReveal.proposal, _proposal, 'invalid proposal')

      if (app._shard[blindedProposal]) {
        assert.strictEqual(logUpdateCounters.shard.toString(10), app._shard[blindedProposal], 'invalid shard')
      }

      assert.strictEqual(logUpdateCounters.proposal, _proposal, 'invalid proposal')

      // read from blockchain after transaction
      let counts = await app.counts(logUpdateCounters.shard, _proposal)
      let roots = await app.roots(logUpdateCounters.shard)

      assert.strictEqual(counts.toString(10), logUpdateCounters.counts.toString(10), 'invalid counts')

      if (prevCounts !== null) {
        assert.strictEqual(counts.toString(10), prevCounts.add(1).toString(10), 'counts should increment')
      }

      if (logUpdateCounters.newWinner) {
        assert.strictEqual(roots, _proposal, 'invalid winning proposal')
      } else {
        assert.strictEqual(roots, prevRoots, 'invalid root proposal')
      }
    }

    return results
  }


  app.informAboutEnd = async (_txAttr, _expectThrow) => {

    _txAttr = app.getTxAttr(_txAttr)

    let action = () => app.instance.informAboutEnd(_txAttr)

    let results = await app.executeAction(action, _txAttr, null, 'LogInformAboutEnd', _expectThrow)

    if (!_expectThrow) {

      let logInformAboutEnd = results.LogInformAboutEnd[0]
      assert.isTrue(logInformAboutEnd.informed, 'invalid logInformAboutEnd.informed')

    }

    return results
  }

  app.voters = async (_address) => {
    assert.isNotEmpty(_address);
    let res = await app.instance.voters(_address);

    let i = 0;

    return {
      voted: res[i++],
      blindedProposal: res[i++],
      shard: res[i++].toString(10),
      proposal: res[i++],
      revealed: res[i++]
    }
  }

  app.roots = async (_shard) => {
    assert.isNotEmpty(_shard)
    return app.instance.roots(_shard)
  }

  app.counts = async (_shard, _proposal) => {
    assert.isNotEmpty(_shard)
    assert.isNotEmpty(_proposal)
    return app.instance.counts(_shard, _proposal)
  }

  app.getNumberOfVerifiers = async () => {
    return app.instance.getNumberOfVerifiers.call()
  }

  return app
}

module.exports = ProxyContract
