import { ethGetTransactionReceipt } from './web3';

const debug = 0;

/**
 * this module checks, if transaction was successful (eg. mined), base on tx hash
 * it also checks, if tx emitted correct number of events (if _logCount provided)
 *
 * @param tx object returned by a transaction OR transaction hash
 * @param logCount int - how many logs should transaction emmit
 *
 * @return transaction receipt on success
 *
 * @version 2018-08-23
 */
export default async function txCheck(tx, logCount) {
  let txReceipt;
  let hash;

  // check if we already have a receipt:
  if (typeof tx === 'string') {
    if (debug) console.log('[txCheck] _tx type is string:', tx);

    hash = tx;
    txReceipt = await ethGetTransactionReceipt(tx);
  } else if (typeof tx === 'object') {
    if (debug) console.log('[txCheck] _tx type is object');

    assert.isDefined(tx.tx, '[txCheck] Transaction hash is empty');
    assert.lengthOf(tx.tx, 66, '[txCheck] Transaction hash invalid');
    assert.isDefined(tx.receipt, '[txCheck] Transaction receipt is empty');
    assert.isTrue(typeof tx.receipt === 'object', '[txCheck] Transaction receipt invalid');

    hash = tx.tx;
    txReceipt = tx.receipt;
  } else {
    assert(false, '[txCheck] empty transaction hash/object');
    return null;
  }

  assert.strictEqual(parseInt(txReceipt.status, 16), 1, '[txCheck] Transaction status is invalid');

  if (logCount && typeof tx === 'object') {
    assert.equal(txReceipt.logs.length, logCount, '[txCheck] Amount of emitted logs invalid');
  }

  assert.strictEqual(txReceipt.transactionHash, hash, '[txCheck] invalid hash');

  return txReceipt;
}
