pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/cryptography/MerkleProof.sol";

import "digivice/contracts/interfaces/IVerifierRegistry.sol";

import "contract-registry/contracts/interfaces/IContractRegistry.sol";
import "contract-registry/contracts/interfaces/RegistrableWithSingleStorage.sol";

import "./interface/IChain.sol";
import "./ChainStorage.sol";

/// @title Andromeda chain election contract
/// @dev https://lucidity.slab.com/posts/andromeda-election-mechanism-e9a79c2a
contract Chain is IChain, RegistrableWithSingleStorage, ReentrancyGuard, Ownable {
  using SafeMath for uint256;

  bytes32  constant NAME = "Chain";

  modifier whenProposePhase() {
    require(getCurrentElectionCycleBlock() < blocksPerPropose(), "we are not in propose phase");
    _;
  }
  modifier whenRevealPhase() {
    require(getCurrentElectionCycleBlock() >= blocksPerPropose(), "we are not in reveal phase");
    _;
  }

  constructor (
    IContractRegistry _contractRegistry,
    ChainStorage _chainStorage
  )
  RegistrableWithSingleStorage(address(_contractRegistry), IStorageBase(address(_chainStorage)))
  public {
  }

  function contractName() external view returns(bytes32) {
    return NAME;
  }

  /// @dev Each operator / verifier submits an encrypted proposal, where each proposal
  ///      is a unique (per cycle) to avoid propsal peeking. When we start proposing,
  ///      we need one of the following:
  ///      1. a clear state (counters must be cleared)
  ///      2. OR, if nobody revealed in previous cycle, we continue previous state
  ///         with all previous getBlockVoter/proposals
  /// @param _blindedProposal this is hash of the proposal + secret
  /// @param _blockHeight it's election ID
  function propose(bytes32 _blindedProposal, uint256 _blockHeight)
  external
  whenProposePhase
  // we have external call in `_getVerifierInfo` to `verifierRegistry`,
  // so `nonReentrant` can be additional safety feature here
  nonReentrant
  returns (bool) {
    uint256 blockHeight = getBlockHeight();

    require(_blockHeight == blockHeight, "invalid blockHeight");
    require(_blindedProposal != bytes32(0), "_blindedProposal is empty");
    require(_storage().isUniqueBlindedProposal(blockHeight, _blindedProposal), "blindedProposal not unique");

    bool active;
    bool enabled;
    uint256 balance;
    uint256 shard;
    (active, enabled, balance, shard) = _getVerifierInfo(msg.sender);
    require(active && enabled, "verifier is not in the registry or not active");
    require(balance > 0, "verifier has no right to propose");

    ChainStorage.Voter memory voter;
    (voter.blindedProposal, voter.shard, voter.proposal, voter.balance) = _storage().getBlockVoter(blockHeight, msg.sender);

    require(voter.blindedProposal == bytes32(0), "verifier already proposed in this round");

    _storage().setUniqueBlindedProposal(blockHeight, _blindedProposal);

    _storage().updateBlockVoter(blockHeight, msg.sender, _blindedProposal, shard, balance);

    if (_storage().getInitialBlockHeight(shard) == 0) {
      _storage().setInitialBlockHeight(shard, blockHeight);
    }

    emit LogPropose(msg.sender, blockHeight, _blindedProposal, shard, balance);

    return true;
  }

  /// @param _proposal this is proposal in clear form
  /// @param _secret this is secret in clear form
  function reveal(bytes32 _proposal, bytes32 _secret)
  external
  whenRevealPhase
  returns (bool) {
    uint256 blockHeight = getBlockHeight();
    bytes32 proof = createProof(_proposal, _secret);

    ChainStorage.Voter memory voter;
    (voter.blindedProposal, voter.shard, voter.proposal, voter.balance) = _storage().getBlockVoter(blockHeight, msg.sender);

    require(voter.blindedProposal == proof, "your proposal do not exists (are you verifier?) OR invalid proof");
    require(voter.proposal == bytes32(0), "you already revealed");

    _storage().updateBlockVoterProposal(blockHeight, msg.sender, _proposal);

    _updateCounters(voter.shard, _proposal);
    _storage().pushBlockVerifierAddress(blockHeight, msg.sender);

    emit LogReveal(msg.sender, blockHeight, _proposal);

    return true;
  }

  function getBlockHeight() public view returns (uint256) {
    return block.number.div(uint256(blocksPerPropose() + blocksPerReveal()) );
  }

  /// @dev this function needs to be called each time we successfully reveal a proposal
  function _updateCounters(uint256 _shard, bytes32 _proposal)
  internal {
    uint256 blockHeight = getBlockHeight();

    uint256 balance = _storage().getBlockVoterBalance(blockHeight, msg.sender);

    _storage().incBlockCount(blockHeight, _shard, _proposal, balance);
    uint256 shardProposalsCount = _storage().getBlockCount(blockHeight, _shard, _proposal);
    bool newWinner;

    // unless it is not important for some reason, lets use `>` not `>=` in condition below
    // when we ignoring equal values we gain two important things:
    //  1. we save a lot of gas: we do not change state each time we have equal result
    //  2. we encourage voters to vote asap, because in case of equal results,
    //     winner is the first one that was revealed
    if (shardProposalsCount > _storage().getBlockMaxVotes(blockHeight, _shard)) {

      // we do expect that all (or most of) voters will agree about proposal.
      // We can save gas, if we read `roots[shard]` value and check, if we need a change.
      if (_storage().getBlockRoot(blockHeight, _shard) != _proposal) {
        _storage().setBlockRoot(blockHeight, _shard, _proposal);
        newWinner = true;
      }

      _storage().setBlockMaxVotes(blockHeight, _shard, shardProposalsCount);
    }

    uint256 tokensBalance = _getTotalTokenBalancePerShard(_shard);

    if (_storage().getBlockBalance(blockHeight, _shard) != tokensBalance) {
      _storage().setBlockBalance(blockHeight, _shard, tokensBalance);
    }

    emit LogUpdateCounters(msg.sender, blockHeight, _shard, _proposal, shardProposalsCount, balance, newWinner, tokensBalance);
  }

  function _getVerifierInfo(address _verifier) internal view returns (bool active, bool enabled, uint256 balance, uint256 shard) {
    IVerifierRegistry registry = IVerifierRegistry(contractRegistry.contractByName("VerifierRegistry"));
    ( , , , active, balance, shard, enabled) = registry.verifiers(_verifier);
  }

  function _getTotalTokenBalancePerShard(uint256 _shard) internal view returns (uint256) {
    IVerifierRegistry registry = IVerifierRegistry(contractRegistry.contractByName("VerifierRegistry"));
    return registry.balancesPerShard(_shard);
  }

  function createProof(bytes32 _proposal, bytes32 _secret) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(_proposal, _secret));
  }

  function getBlockRoot(uint256 _blockHeight, uint256 _shard) external view returns (bytes32) {
    return _storage().getBlockRoot(_blockHeight, _shard);
  }

  function getBlockVoter(uint256 _blockHeight, address _voter)
  external
  view
  returns (bytes32 blindedProposal, uint256 shard, bytes32 proposal, uint256 balance) {
    (blindedProposal, shard, proposal, balance) = _storage().getBlockVoter(_blockHeight, _voter);
  }

  function getBlockMaxVotes(uint256 _blockHeight, uint256 _shard) external view returns (uint256) {
    return _storage().getBlockMaxVotes(_blockHeight, _shard);
  }

  function getBlockCount(uint256 _blockHeight, uint256 _shard, bytes32 _proposal) external view returns (uint256) {
    return _storage().getBlockCount(_blockHeight, _shard, _proposal);
  }

  function getBlockAddress(uint256 _blockHeight, uint256 _i) external view returns (address) {
    return _storage().getBlockVerifierAddress(_blockHeight, _i);
  }

  function getBlockAddressCount(uint256 _blockHeight) external view returns (uint256) {
    return _storage().getBlockVerifierAddressesCount(_blockHeight);
  }

  function getStakeTokenBalanceFor(uint256 _blockHeight, uint256 _shard) external view returns (uint256) {
    return _storage().getBlockBalance(_blockHeight, _shard);
  }

  function isElectionValid(uint256 _blockHeight, uint256 _shard) external view returns (bool) {
    uint256 balance = _storage().getBlockBalance(_blockHeight, _shard);
    if (balance == 0) return false;
    return _storage().getBlockMaxVotes(_blockHeight, _shard) * 100 / balance >= minimumStakingTokenPercentage();
  }

  function _storage() private view returns (ChainStorage) {
    return ChainStorage(address(singleStorage));
  }

  // temporary function, should not be part of protocol,
  // we might want to remove it when we will be live ready
  function setInitialBlockHeight(uint256 _shard, uint256 _blockHeight) external onlyOwner {
    _storage().setInitialBlockHeight(_shard, _blockHeight);
  }

  function updateMinimumStakingTokenPercentage(uint8 _minimumStakingTokenPercentage)
  public
  onlyOwner
  returns (bool) {
    return _storage().updateMinimumStakingTokenPercentage(_minimumStakingTokenPercentage);
  }

  function updateMinimumStakingTokenPercentageEnabled()
  public
  view
  returns (bool) {
    return _storage().updateMinimumStakingTokenPercentageEnabled();
  }

  function minimumStakingTokenPercentage()
  public
  view
  returns (uint8) {
    return _storage().minimumStakingTokenPercentage();
  }

  function blocksPerPropose()
  public
  view
  returns (uint8) {
    return _storage().blocksPerPropose();
  }

  function blocksPerReveal()
  public
  view
  returns (uint8) {
    return _storage().blocksPerReveal();
  }

  function getCurrentElectionCycleBlock()
  public
  view
  returns (uint256) {
    return block.number % (uint256(blocksPerPropose() + blocksPerReveal()));
  }

  /// @return first block number (blockchain block) of current cycle
  function getFirstCycleBlock()
  public
  view
  returns (uint256) {
    return block.number.sub(getCurrentElectionCycleBlock());
  }

  function isProposePhase()
  public
  view
  returns (bool) {
    return getCurrentElectionCycleBlock() < blocksPerPropose();
  }

  function initialBlockHeights(uint256 _shard)
  public
  view
  returns (uint256) {
    return _storage().initialBlockHeights(_shard);
  }

  function isValidLeaf(
    uint256 _blockHeight,
    uint256 _shard,
    bytes32 _leafId,
    bytes32[] memory _proof
  )
  public
  view
  returns (bool valid) {
    bytes32 root = _storage().getBlockRoot(_blockHeight, _shard);
    require(_blockHeight > 0, "block height must be positive");
    require(root != bytes32(0), "root for the given block is not valid");
  
    bool proven = MerkleProof.verify(
      _proof,
      root,
      _leafId
    );

    return proven;
  }

  // override `SingleStorageStrategy.detachFromStorage`
  function detachFromStorage(address _newStorageOwner)
  internal {
    require(singleStorage.switchOwnerTo(_newStorageOwner), "[detachFromStorage] failed");

    emit LogDetachFromStorage(msg.sender, _newStorageOwner);

    // _suicide(); - do not kill me after unregistering
  }
}
