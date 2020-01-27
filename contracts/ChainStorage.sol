pragma solidity ^0.5.0;

import "contract-registry/contracts/storage/StorageBase.sol";

/// @title Andromeda chIChainain election contract
/// @dev https://lucidity.slab.com/posts/andromeda-election-mechanism-e9a79c2a
contract ChainStorage is StorageBase {
  /// @dev this is our structure for holding getBlockVoter/proposals
  ///      each vote will be deleted after reveal
  struct Voter {
    bytes32 blindedProposal;
    uint256 shard;
    bytes32 proposal;
    uint256 balance;
  }

  /// @dev structure of block that is created for each election
  struct Block {
    /// @dev shard => root of merkle tree (the winner)
    mapping(uint256 => bytes32) roots;
    mapping(bytes32 => bool) uniqueBlindedProposals;
    mapping(address => Voter) voters;

    /// @dev shard => max votes
    mapping(uint256 => uint256) maxsVotes;

    // shard => proposal => counts
    // Im using mapping, because its less gas consuming that array,
    // and also it is much easier to work with mapping than with array
    // unfortunately we can't be able to delete this data to release gas, why?
    // because to do this, we need to save all the keys and then run loop for all keys... that may cause OOG
    // also storing keys is more gas consuming so... I made decision to stay with mapping and never delete history
    mapping(uint256 => mapping(bytes32 => uint256)) counts;

    /// @dev shard => total amount of tokens
    mapping(uint256 => uint256) balancesPerShard;

    address[] verifierAddresses;
  }

  /// @dev blockHeight => Block - results of each elections will be saved here: one block (array element) per election
  mapping(uint256 => Block) blocks;

  /// @dev shard => blockHeight
  mapping(uint256 => uint256) public initialBlockHeights;

  bool public updateMinimumStakingTokenPercentageEnabled;

  uint8 public blocksPerPropose;
  uint8 public blocksPerReveal;

  uint8 public minimumStakingTokenPercentage;

  event LogChainConfig(
    uint8 blocksPerPropose,
    uint8 blocksPerReveal,
    uint8 requirePercentOfTokens,
    bool updateMinimumStakingTokenPercentageEnabled
  );

  constructor(
    uint8 _blocksPerPropose,
    uint8 _blocksPerReveal,
    uint8 _minimumStakingTokenPercentage,
    bool _updateMinimumStakingTokenPercentageEnabled) public {
    require(_blocksPerPropose > 0, "_blocksPerPropose can't be empty");
    require(_blocksPerReveal > 0, "_blocksPerReveal can't be empty");
    blocksPerPropose = _blocksPerPropose;
    blocksPerReveal = _blocksPerReveal;

    require(_minimumStakingTokenPercentage > 0, "_minimumStakingTokenPercentage can't be empty");
    require(_minimumStakingTokenPercentage <= 100, "_minimumStakingTokenPercentage can't be over 100%");
    minimumStakingTokenPercentage = _minimumStakingTokenPercentage;

    updateMinimumStakingTokenPercentageEnabled = _updateMinimumStakingTokenPercentageEnabled;

    emit LogChainConfig(
      _blocksPerPropose,
      _blocksPerReveal,
      _minimumStakingTokenPercentage,
      _updateMinimumStakingTokenPercentageEnabled
    );
  }

  function getInitialBlockHeight(uint256 _shard) public view returns (uint256) {
    return initialBlockHeights[_shard];
  }

  function setInitialBlockHeight(uint256 _shard, uint256 _blockHeight) external onlyFromStorageOwner {
    initialBlockHeights[_shard] = _blockHeight;
  }

  function getBlockRoot(uint256 _blockHeight, uint256 _shard) public view returns (bytes32) {
    return blocks[_blockHeight].roots[_shard];
  }

  function setBlockRoot(uint256 _blockHeight, uint256 _shard, bytes32 _proposal) external onlyFromStorageOwner returns (bool) {
    blocks[_blockHeight].roots[_shard] = _proposal;
    return true;
  }

  function getBlockMaxVotes(uint256 _blockHeight, uint256 _shard) public view returns (uint256) {
    return blocks[_blockHeight].maxsVotes[_shard];
  }

  function setBlockMaxVotes(uint256 _blockHeight, uint256 _shard, uint256 _proposalsCount) external onlyFromStorageOwner returns (bool) {
    blocks[_blockHeight].maxsVotes[_shard] = _proposalsCount;
    return true;
  }

  function getBlockCount(uint256 _blockHeight, uint256 _shard, bytes32 _proposal) public view returns (uint256) {
    return blocks[_blockHeight].counts[_shard][_proposal];
  }

  function incBlockCount(uint256 _blockHeight, uint256 _shard, bytes32 _proposal, uint256 _value) external onlyFromStorageOwner returns (bool) {
    blocks[_blockHeight].counts[_shard][_proposal] += _value;
    return true;
  }

  function getBlockBalance(uint256 _blockHeight, uint256 _shard) public view returns (uint256) {
    return blocks[_blockHeight].balancesPerShard[_shard];
  }

  function setBlockBalance(uint256 _blockHeight, uint256 _shard, uint256 _balance) external onlyFromStorageOwner returns (bool) {
    blocks[_blockHeight].balancesPerShard[_shard] = _balance;
    return true;
  }

  function getBlockVerifierAddress(uint256 _blockHeight, uint256 _i) public view returns (address) {
    return blocks[_blockHeight].verifierAddresses[_i];
  }

  function getBlockVerifierAddressesCount(uint256 _blockHeight) public view returns (uint256) {
    return blocks[_blockHeight].verifierAddresses.length;
  }

  function isUniqueBlindedProposal(uint256 _blockHeight, bytes32 _blindedProposal) public view returns (bool) {
    return !blocks[_blockHeight].uniqueBlindedProposals[_blindedProposal];
  }

  function setUniqueBlindedProposal(uint256 _blockHeight, bytes32 _blindedProposal) external onlyFromStorageOwner returns (bool) {
    blocks[_blockHeight].uniqueBlindedProposals[_blindedProposal] = true;
    return true;
  }

  function getBlockVoter(uint256 _blockHeight, address _voterAddr) public view returns (bytes32 blindedProposal,
    uint256 shard,
    bytes32 proposal,
    uint256 balance) {
    Voter memory voter = blocks[_blockHeight].voters[_voterAddr];
    return (voter.blindedProposal, voter.shard, voter.proposal, voter.balance);
  }

  function getBlockVoterBalance(uint256 _blockHeight, address _voterAddr) public view returns (uint256) {
    return blocks[_blockHeight].voters[_voterAddr].balance;
  }

  function updateBlockVoterProposal(uint256 _blockHeight, address _voterAddr, bytes32 _proposal) external onlyFromStorageOwner returns (bool) {
    Voter storage voter = blocks[_blockHeight].voters[_voterAddr];
    voter.proposal = _proposal;
    return true;
  }

  function updateBlockVoter(uint256 _blockHeight, address _voterAddr, bytes32 _blindedProposal, uint256 _shard, uint256 _balance)
  external onlyFromStorageOwner returns (bool) {
    Voter storage voter = blocks[_blockHeight].voters[_voterAddr];
    voter.blindedProposal = _blindedProposal;
    voter.shard = _shard;
    voter.balance = _balance;
    return true;
  }

  function pushBlockVerifierAddress(uint256 _blockHeight, address _verifierAddr) external onlyFromStorageOwner returns (bool) {
    blocks[_blockHeight].verifierAddresses.push(_verifierAddr);
    return true;
  }

  function updateMinimumStakingTokenPercentage(uint8 _minimumStakingTokenPercentage)
  external
  onlyFromStorageOwner
  returns (bool) {
    require(updateMinimumStakingTokenPercentageEnabled, "update not available");

    require(_minimumStakingTokenPercentage > 0, "_minimumStakingTokenPercentage can't be empty");
    require(_minimumStakingTokenPercentage <= 100, "_minimumStakingTokenPercentage can't be over 100%");
    minimumStakingTokenPercentage = _minimumStakingTokenPercentage;

    emit LogChainConfig(blocksPerPropose, blocksPerReveal, _minimumStakingTokenPercentage, true);

    return true;
  }
}
