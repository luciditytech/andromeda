// reflect returned array into an object with named attributes
function formatVerifier(ethResponse) {
  // make sure, that below properties are in the same order as `struct Verifier` in contract:
  // https://github.com/luciditytech/digivice/blob/develop/contracts/VerifierRegistry.sol
  return {
    id: ethResponse[0],
    location: ethResponse[1],
    created: ethResponse[2],
    balance: ethResponse[3].toString(10),
    shard: ethResponse[4].toString(10),
  };
}

module.exports.format = formatVerifier;
