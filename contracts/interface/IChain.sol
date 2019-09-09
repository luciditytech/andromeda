pragma solidity ^0.5.0;

/// @title Interface for Chain contract
/// @dev We do not use this interface in our `Chain.sol`. This is only for external usage.
///      Use it instead of importing whole contract. It will save you gas.
interface IChain {
  event LogPropose(address indexed sender, uint256 blockHeight, bytes32 blindedProposal, uint256 shard, uint256 balance);
  event LogReveal(address indexed sender, uint256 blockHeight, bytes32 proposal);
  event LogUpdateCounters(
    address indexed sender,
    uint256 blockHeight,
    uint256 shard,
    bytes32 proposal,
    uint256 counts,
    uint256 balance,
    bool newWinner,
    uint256 totalTokenBalanceForShard
  );

  function propose(bytes32 _blindedProposal, uint256 _blockHeight) external returns(bool);
  function reveal(bytes32 _proposal, bytes32 _secret, uint256 _blockHeight) external returns(bool);

  function getBlockRoot(uint256 _blockHeight, uint256 _shard) external view returns (bytes32);
  function getBlockVoter(uint256 _blockHeight, address _voter)
    external view returns (bytes32 blindedProposal, uint256 shard, bytes32 proposal, uint256 balance);
  function getBlockCount(uint256 _blockHeight, uint256 _shard, bytes32 _proposal) external view returns (uint256);

  function isElectionValid(uint256 _blockHeight, uint256 _shard) external view returns (bool);
  function isProposePhase() external view returns (bool);
  function contractName() external view returns(bytes32);
}
