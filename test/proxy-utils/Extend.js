let debug = 0

export const Extend = function (destination, source) {
  for (let k in source) {
    if (source.hasOwnProperty(k)) {
      destination[k] = source[k]
      debug && console.log('extend', k, 'source type: ', typeof source[k], 'destination type: ', typeof destination[k])
    } else if (typeof destination[k] === 'undefined' || destination[k] === null) {
      // destination[k] = source[k]
      // debug && console.log('overwrite null with:', typeof source[k], k)

    } else {
      debug && console.log('does not hasOwnProperty', k)
    }
  }
  return destination
}
