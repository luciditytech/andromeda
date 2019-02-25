pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "digivice/contracts/VerifierRegistry.sol";
import "./ChainConfig.sol";


/// @title Andromeda chain election contract
/// @dev https://lucidity.slab.com/posts/andromeda-election-mechanism-e9a79c2a
contract Chain is ChainConfig, ReentrancyGuard {

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
    mapping (uint256 => bytes32) roots;
    mapping (bytes32 => bool) uniqueBlindedProposals;
    mapping (address => Voter) voters;

    /// @dev shard => max votes
    mapping (uint256 => uint256) maxsVotes;

    // shard => proposal => counts
    // Im using mapping, because its less gas consuming that array,
    // and also it is much easier to work with mapping than with array
    // unfortunately we can't be able to delete this data to release gas, why?
    // because to do this, we need to save all the keys and then run loop for all keys... that may cause OOG
    // also storing keys is more gas consuming so... I made decision to stay with mapping and never delete history
    mapping (uint256 => mapping(bytes32 => uint256)) counts;

    /// @dev shard => total amount of tokens
    mapping (uint256 => uint256) balancesPerShard;

    address[] verifierAddresses;
  }

  /// @dev blockHeight => Block - results of each elections will be saved here: one block (array element) per election
  mapping (uint256 => Block) blocks;

  /// @dev shard => blockHeight
  mapping (uint256 => uint256) public initialBlockHeights;

  constructor (
    address _registryAddress,
    uint8 _blocksPerPhase,
    uint8 _minimumStakingTokenPercentage,
    bool _updateMinimumStakingTokenPercentageEnabled
  )
  ChainConfig(_registryAddress, _blocksPerPhase, _minimumStakingTokenPercentage, _updateMinimumStakingTokenPercentageEnabled)
  public {

  }

  /// @dev Each operator / verifier submits an encrypted proposal, where each proposal
  ///      is a unique (per cycle) to avoid propsal peeking. When we start proposing,
  ///      we need one of the following:
  ///      1. a clear state (counters must be cleared)
  ///      2. OR, if nobody revealed in previous cycle, we continue previous state
  ///         with all previous getBlockVoter/proposals
  /// @param _blindedProposal this is hash of the proposal + secret
  function propose(bytes32 _blindedProposal)
  external
  whenProposePhase
  // we have external call in `_getVerifierInfo` to `verifierRegistry`,
  // so `nonReentrant` can be additional safety feature here
  nonReentrant
  returns (bool) {

    uint256 blockHeight = getBlockHeight();

    require(_blindedProposal != bytes32(0), "_blindedProposal is empty");
    require(!blocks[blockHeight].uniqueBlindedProposals[_blindedProposal], "blindedProposal not unique");

    bool active;
    uint256 balance;
    uint256 shard;
    (active, balance, shard) = _getVerifierInfo(msg.sender);
    require(active, "verifier is not in the registry or not active");
    require(balance > 0, "verifier has no right to propose");


    Voter storage voter = blocks[blockHeight].voters[msg.sender];
    require(voter.blindedProposal == bytes32(0), "verifier already proposed in this round");

    // now we can save proposal

    blocks[blockHeight].uniqueBlindedProposals[_blindedProposal] = true;

    voter.blindedProposal = _blindedProposal;
    voter.shard = shard;
    voter.balance = balance;

    if (initialBlockHeights[shard] == 0) {
      initialBlockHeights[shard] = blockHeight;
    }

    emit LogPropose(msg.sender, blockHeight, _blindedProposal, shard, balance);

    return true;
  }

  function createProof(bytes32 _proposal, bytes32 _secret)
  public
  pure
  returns (bytes32) {
    return keccak256(abi.encodePacked(_proposal, _secret));
  }

  /// @param _proposal this is proposal in clear form
  /// @param _secret this is secret in clear form
  function reveal(bytes32 _proposal, bytes32 _secret)
  external
  whenRevealPhase
  returns (bool) {

    uint256 blockHeight = getBlockHeight();
    bytes32 proof = createProof(_proposal, _secret);

    Voter storage voter = blocks[blockHeight].voters[msg.sender];
    require(voter.blindedProposal == proof, "your proposal do not exists (are you verifier?) OR invalid proof");
    require(voter.proposal == bytes32(0), "you already revealed");

    voter.proposal = _proposal;
    _updateCounters(voter.shard, _proposal);

    blocks[blockHeight].verifierAddresses.push(msg.sender);

    emit LogReveal(msg.sender, blockHeight, _proposal);

    return true;
  }

  /// @dev gets information about verifier from global registry
  /// @return (bool active, uint256 balance, uint256 shard)
  function _getVerifierInfo(address _verifier)
  internal
  view
  returns (bool active, uint256 balance, uint256 shard) {
    VerifierRegistry registry = VerifierRegistry(registryAddress);

    ( , , , active, balance, shard) = registry.verifiers(_verifier);
  }

  function _getTotalTokenBalancePerShard(uint256 _shard)
  internal
  view
  returns (uint256) {
    VerifierRegistry registry = VerifierRegistry(registryAddress);
    return registry.balancesPerShard(_shard);
  }

  function getBlockHeight()
  public
  view
  returns (uint256) {
    return block.number.div(uint256(blocksPerPhase) * 2);
  }


  /// @dev this function needs to be called each time we successfully reveal a proposal
  function _updateCounters(uint256 _shard, bytes32 _proposal)
  internal {
    uint256 blockHeight = getBlockHeight();

    uint256 balance = blocks[blockHeight].voters[msg.sender].balance;

    blocks[blockHeight].counts[_shard][_proposal] += balance;
    uint256 shardProposalsCount = blocks[blockHeight].counts[_shard][_proposal];
    bool newWinner;

    // unless it is not important for some reason, lets use `>` not `>=` in condition below
    // when we ignoring equal values we gain two important things:
    //  1. we save a lot of gas: we do not change state each time we have equal result
    //  2. we encourage voters to vote asap, because in case of equal results,
    //     winner is the first one that was revealed
    if (shardProposalsCount > blocks[blockHeight].maxsVotes[_shard]) {

      // we do expect that all (or most of) voters will agree about proposal.
      // We can save gas, if we read `roots[shard]` value and check, if we need a change.
      if (blocks[blockHeight].roots[_shard] != _proposal) {
        blocks[blockHeight].roots[_shard] = _proposal;
        newWinner = true;
      }

      blocks[blockHeight].maxsVotes[_shard] = shardProposalsCount;
    }

    uint256 tokensBalance = _getTotalTokenBalancePerShard(_shard);
    if (blocks[blockHeight].balancesPerShard[_shard] != tokensBalance) {
      blocks[blockHeight].balancesPerShard[_shard] = tokensBalance;
    }

    emit LogUpdateCounters(msg.sender, blockHeight, _shard, _proposal, shardProposalsCount, balance, newWinner, tokensBalance);
  }



  function getBlockRoot(uint256 _blockHeight, uint256 _shard) external view returns (bytes32) {
    return blocks[_blockHeight].roots[_shard];
  }

  function getBlockVoter(uint256 _blockHeight, address _voter)
  external
  view
  returns (bytes32, uint256, bytes32, uint256) {
    Voter storage voter = blocks[_blockHeight].voters[_voter];
    return (voter.blindedProposal, voter.shard, voter.proposal, voter.balance);
  }

  function getBlockMaxVotes(uint256 _blockHeight, uint256 _shard) external view returns (uint256) {
    return blocks[_blockHeight].maxsVotes[_shard];
  }

  function getBlockCount(uint256 _blockHeight, uint256 _shard, bytes32 _proposal) external view returns (uint256) {
    return blocks[_blockHeight].counts[_shard][_proposal];
  }

  function getBlockAddress(uint256 _blockHeight, uint256 _i) external view returns (address) {
    return blocks[_blockHeight].verifierAddresses[_i];
  }

  function getBlockAddressCount(uint256 _blockHeight) external view returns (uint256) {
    return blocks[_blockHeight].verifierAddresses.length;
  }

  function getStakeTokenBalanceFor(uint256 _blockHeight, uint256 _shard) external view returns (uint256) {
    return blocks[_blockHeight].balancesPerShard[_shard];
  }

  function isElectionValid(uint256 _blockHeight, uint256 _shard) external view returns (bool) {
    Block storage electionBlock = blocks[_blockHeight];
    if (electionBlock.balancesPerShard[_shard] == 0) return false;
    return electionBlock.maxsVotes[_shard] * 100 / electionBlock.balancesPerShard[_shard] >= minimumStakingTokenPercentage;
  }



}
