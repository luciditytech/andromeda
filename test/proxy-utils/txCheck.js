'use strict'

web3.eth.getTransactionReceiptMined = require('./getTransactionReceiptMined.js')

let debug = 0

/**
 * this module checks, if transaction was successful (eg. mined), base on tx hash
 * it also checks, if tx emitted correct number of events (if _logCount provided)
 *
 * @param _tx object returned by a transaction OR transaction hash
 * @param _logCount int - how many logs should transaction emmit
 * @param _txAttr object of transaction parameters like: value, from etc.
 *
 * @return transaction receipt on success
 *
 * @version 2018-08-23
 */
module.exports = async (_tx, _logCount, _txAttr) => {

  if (typeof _logCount === 'undefined') _logCount = false

  let _receipt
  let _hash

  // check if we already have a receipt:
  if (typeof _tx === 'string') {
    debug && console.log('[txCheck] _tx type is string:', _tx)

    _hash = _tx
    _receipt = await web3.eth.getTransactionReceiptPromise(_tx)

  } else if (typeof _tx === 'object') {
    debug && console.log('[txCheck] _tx type is object')

    assert.isDefined(_tx.tx, '[txCheck] Transaction hash is empty')
    assert.lengthOf(_tx.tx, 66, '[txCheck] Transaction hash invalid')
    assert.isDefined(_tx.receipt, '[txCheck] Transaction receipt is empty')
    assert.isTrue(typeof _tx.receipt === 'object', '[txCheck] Transaction receipt invalid')

    _hash = _tx.tx
    _receipt = _tx.receipt

  } else {
    assert(false, '[txCheck] empty transaction hash/object')
    return null
  }

  assert.strictEqual(parseInt(_receipt.status, 16), 1, '[txCheck] Transaction status is invalid')

  if (_logCount && typeof _tx === 'object') {
    assert.equal(_receipt.logs.length, _logCount, '[txCheck] Amount of emitted logs invalid')
  }

  assert.strictEqual(_receipt.transactionHash, _hash, '[txCheck] invalid hash')

  _txAttr.gasUsed = _receipt.gasUsed

  return _receipt
}
