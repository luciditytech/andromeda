'use strict'

let debug = 0

/**
 * @version 2018-08-23
 *
 * @dev this module goes throw all logs and base on parameters, does some actions
 *
 * @param _txLogs - transaction logs, required
 * @param _eventName - name of event we are looking for, if there is no such event, error is throw, optional
 * @param _logCount - number of logs that transaction should emits, if different number then error is throw, false if we don't care
 *
 * @return array or all events
 */
module.exports = (_txLogs, _eventName, _logCount) => {
  if (typeof _eventName === 'undefined') _eventName = false
  if (typeof _logCount === 'undefined') _logCount = false

  if ((typeof _txLogs !== 'object') && !Array.isArray(_txLogs)) {
    assert(false, '[txEvents] Logs must be object or array')
    return null
  }

  if (_logCount) {
    assert.strictEqual(_txLogs.length, _logCount, '[txEvents] Amount of emitted logs invalid')
  }

  debug && console.log('typeof _txLogs', typeof _txLogs)
  debug && console.log('_txLogs.length', _txLogs.length)

  let obj = {}

  for (let i = 0; i < _txLogs.length; i++) {
    let log = _txLogs[i]
    debug && console.log(log)

    // if we don't have this type of log yet, then initiate empty array
    if (typeof obj[log.event] === 'undefined') obj[log.event] = []
    obj[log.event].push(log.args)
  }

  debug && console.log(obj)

  // do we need specific log?
  if (_eventName) {
    if (typeof obj[_eventName] === 'undefined') {
      assert(false, '[txEvents] Expected event `' + _eventName + '` does not exist')
      return null
    }
  }

  return obj
}
