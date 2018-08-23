// reflect returned array into an object with named attributes
function formatVerifier(ethResponse) {

    let i = 0;

    // make sure, that below properties are in the same order as `struct Verifier` in contract:
    // https://github.com/luciditytech/pokedex/blob/develop/contracts/VerifierRegistry.sol
    return {
        id: ethResponse[i++],
        location: ethResponse[i++],
        created: ethResponse[i++],
        balance: ethResponse[i++].toString(10),
        shard: ethResponse[i++].toString(10),
    };
}

module.exports.format = formatVerifier;
