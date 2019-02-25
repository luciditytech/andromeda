// reflect returned array into an object with named attributes
function formatVerifier(ethResponse) {
  // make sure, that below properties are in the same order as `struct Verifier` in contract:
  // https://github.com/luciditytech/digivice/blob/develop/contracts/VerifierRegistry.sol
  return {
    id: ethResponse[0],
    name: ethResponse[1],
    location: ethResponse[2],
    active: ethResponse[3],
    balance: ethResponse[4].toString(10),
    shard: ethResponse[5].toString(10),
  };
}

module.exports.format = formatVerifier;
