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
    enable: ethResponse[6],
  };
}

async function balancesPerShard(registry, shard) {
  const res = await registry.balancesPerShard.call(shard.toString());
  return res.toString();
}

async function verifier(registry, addr) {
  return formatVerifier(await registry.verifiers.call(addr));
}

async function updateActiveStatus(registry, owner, verifiersAddr, activeStatus) {
  await registry.updateActiveStatus(verifiersAddr, activeStatus, { from: owner });

  return await verifier(registry, verifiersAddr).active === activeStatus;
}

async function updateEnableStatus(registry, owner, verifiersAddr, enableStatus) {
  await registry.updateEnableStatus(verifiersAddr, enableStatus, { from: owner });

  return await verifier(registry, verifiersAddr).enable === enableStatus;
}

export {
  balancesPerShard,
  updateActiveStatus,
  updateEnableStatus,
};
