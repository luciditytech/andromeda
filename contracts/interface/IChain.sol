pragma solidity ^0.5.0;

/// @title Interface for Chain contract
/// @dev We do not use this interface in our `Chain.sol`. This is only for external usage.
///      Use it instead of importing whole contract. It will save you gas.
interface IChain {

  event LogPropose(address indexed sender, bytes32 blindedProposal, uint256 shard, uint256 balance);
  event LogReveal(address indexed sender, bytes32 proposal);
  event LogUpdateCounters(uint256 shard, bytes32 proposal, uint256 counts, bool newWinner, uint256 tokens);
  event LogExtendElection(uint256 previousStartBlock, uint256 newStartBlock);


  function propose(bytes32 _blindedProposal) external returns(bool);
  function reveal(bytes32 _proposal, bytes32 _secret) external returns(bool);

  function getBlockRoot(uint256 _blockHeight, uint256 _shard) external view returns (bytes32);
  function getBlockVoter(uint256 _blockHeight, address _voter) external view returns (bytes32, uint256, bytes32, uint256);
  function getBlockMaxsVotes(uint256 _blockHeight, uint256 _shard) external view returns (uint256);
  function getBlockCount(uint256 _blockHeight, uint256 _shard, bytes32 _proposal) external view returns (uint256);
  function getBlockAddressCount(uint256 _blockHeight) external view returns (uint256);

  function getCycleBlock() external view returns (uint);
  function getFirstCycleBlock() external view returns (uint);

  function getStakeTokens(uint256 _blockHeight, uint256 _shard) external view returns (uint256);
  function isElectionValid(uint256 _blockHeight, uint256 _shard) external view returns (bool);

}
