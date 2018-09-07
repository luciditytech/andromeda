pragma solidity ^0.4.24;

contract AbstractChain {
  function electionEnded(
    address _election,
    bytes32 _newRoot,
    bytes32[] _campaignIds,
    bytes32[] _channelIds,
    uint256[] _impressions,
    uint256[] _clicks,
    uint256[] _conversions
  ) public;

  function electionCounted(address _electionAddress) public;
}
