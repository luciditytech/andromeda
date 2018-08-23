'use strict'

let Web3Utils = require('web3-utils')

const Promise = require('bluebird')
if (typeof web3.eth.getAccountsPromise === 'undefined') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' })
}

const expectedExceptionPromise = require('./expectedException.js')
const txCheck = require('./txCheck.js')
const txEvents = require('./txEvents.js')

// this is just to know, how much chars cen we put in one line
let lineLength = 118
let debug = 0

/**
 * @dev Idea for this function is to be called from test/proxy-contracts/* when transaction needs to be made.
 *
 */
function proxyExecute () {
  let app = {}
  let txAttr = {}
  let txAttrSaved = {}

  let _tx
  let _ev
  let _result

  app.instance = null


  // this function is called each time you use `getTxAttr()`, if you want values to be saves permanently
  // you can use `set...Var()` functions
  app.resetTxAttr = function () {
    txAttr = {
      from: Web3Utils.randomHex(20),
      gas: 6700000
    }
  }

  app.setGasVar = (_gas) => {
    txAttrSaved.gas = _gas
  }

  app.setInstanceVar = (i) => {
    app.instance = i
  }

  app.setFromVar = async (_from) => {
    txAttrSaved.from = _from

    // display owner balance - just for test information
    let b = await web3.eth.getBalancePromise(_from)
    b = parseFloat(web3.fromWei(b.toString(10), 'ether'))

    process.stderr.write(' '.repeat(lineLength) + '\r')
    debug && console.log('[proxyExecute] new `txAttr.from` balance', b, 'ETH')
  }

  /// @param txAttr - (optional) can be empty or can be object with transaction parameters like: from, gas etc
  /// @return object with default transaction parameters overriden by values from _txAttr
  app.getTxAttr = (_txAttr) => {
    app.resetTxAttr()

    for (let k in txAttrSaved) {
      txAttr[k] = txAttrSaved[k]
    }

    // do we have saved values?
    if (typeof _txAttr === 'object') {
      for (let k in _txAttr) {
        txAttr[k] = _txAttr[k]
      }
    }

    return txAttr
  }

  /**
     * this function should be used for executing transactions
     *
     * @param _action - required - promise action, that should be executed eg:
     * let action = () => this._instance.setOwner(_newOwner, _txAttr)
     */
  app.executeAction = async function (_action, _txAttr, _logCount, _eventWanted, _expectThrow) {

    if (_expectThrow) {
      _result = await expectedExceptionPromise(_action, _txAttr.gas)
    } else {
      try {
        _tx = await _action()
        await txCheck(_tx, _logCount, _txAttr)
        _ev = txEvents(_tx.logs, _eventWanted, _logCount)
      } catch (e) {
        if ((e + '').indexOf('account not recognized') > -1) {
          assert.isTrue(false, 'Check if msg.sender exists and its not generated by random numbers: ' + e.message)
        } else {
          // console.log(_tx)
          // console.log(_receipt)
          throw e
        }
      }
    }

    return _expectThrow ? _result : _ev
  }

  return app
}

module.exports = proxyExecute
