pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";
import "pokedex/contracts/VerifierRegistry.sol";
import "contracts/AbstractChain.sol";

contract Election is ReentrancyGuard {
  address public registryAddress;
  address public chairperson;
  address public chainAddress;
  mapping(address => Voter) public voters;
  address[] public addresses;
  mapping(bytes32 => bool) public blindedProposals;
  uint public blockNumber;

  /// @dev shard => proposal => count
  mapping(uint256 => mapping(bytes32 => uint256)) public counts;

  /// @dev this is where we keep information about real-time votes counting
  /// base on this, we will be updating `roots` while counting votes
  /// so this is needed for selecting a winner
  /// mapping does: shard => max
  mapping(uint256 => uint256) private maxsVotes;

  bytes32 public previousRoot;

  /// @dev shard => proposal - here we store winning proposals
  mapping(uint256 => bytes32) public roots;
  uint256 public startsAt;
  uint256 public endsAt;

  bool public revealed;
  uint256 public votingEnd;
  uint256 public revealEnd;

  /// @dev prevent calling `informAboutEnd()` twice
  bool informAboutEndNonce;

  struct Voter {
    bool voted;
    bytes32 blindedProposal;
    uint256 shard;
    bytes32 proposal;
    bool revealed;
  }

  modifier onlyBefore(uint _time) { if (now >= _time) revert(); _; }
  modifier onlyAfter(uint _time) { if (now <= _time) revert(); _; }

  event LogVote(address indexed sender, bytes32 blindedProposal, uint256 shard);
  event LogReveal(address indexed sender, bytes32 proposal);
  event LogUpdateCounters(uint256 shard, bytes32 proposal, uint256 counts, bool newWinner);
  event LogInformAboutEnd(address indexed sender, bool informed);

  constructor (
    address _registryAddress,
    address _chainAddress,
    uint _blockNumber,
    bytes32 _previousRoot,
    uint256 _startsAt,
    uint256 _endsAt,
    uint256 _votingTime,
    uint _revealTime
  ) public {
    registryAddress = _registryAddress;
    chainAddress = _chainAddress;
    blockNumber = _blockNumber;
    previousRoot = _previousRoot;
    startsAt = _startsAt;
    endsAt = _endsAt;
    votingEnd = now + _votingTime;
    revealEnd = votingEnd + _revealTime;
  }

  function getNumberOfVerifiers() public view returns (uint) {
    return addresses.length;
  }

  /*
   * each operator/verifier submits an encrypted proposal
   * each proposal is unique to avoid proposal peeking
   */
  function vote(bytes32 _blindedProposal) onlyBefore(votingEnd) external nonReentrant {
    Voter storage sender = voters[msg.sender];
    require(!sender.voted);
    require(!blindedProposals[_blindedProposal]);

    VerifierRegistry registry = VerifierRegistry(registryAddress);

    bool created;
    uint256 shard;

    ( , , created, , shard) = registry.verifiers(msg.sender);
    require(created);

    sender.blindedProposal = _blindedProposal;
    sender.voted = true;
    sender.shard = shard;
    blindedProposals[_blindedProposal] = true;
    addresses.push(msg.sender);

    emit LogVote(msg.sender, _blindedProposal, shard);
  }

  /*
   * operators/verifiers must provide the secret used to encrypt their proposal
   */
  function reveal(bytes32 _proposal, bytes32 _secret)
    onlyAfter(votingEnd)
    onlyBefore(revealEnd)
    external nonReentrant {
    Voter storage sender = voters[msg.sender];
    require(sender.voted);
    require(!sender.revealed);

    bytes32 proof = keccak256(abi.encodePacked(_proposal, _secret));
    require(sender.blindedProposal == proof);

    sender.proposal = _proposal;
    sender.revealed = true;
    emit LogReveal(msg.sender, _proposal);

    /// @dev once we have a valid reveal, we can update our counters
    _updateCounters(sender.shard, _proposal);

  }

  /// @dev after reveal each vote, we need to update information about statistics/maxs of the election
  /// this function needs to be called ech time we successfully reveal a vote
  function _updateCounters(uint256 _shard, bytes32 _proposal)
  private {

    counts[_shard][_proposal] += 1;
    uint256 shardProposals = counts[_shard][_proposal];
    bool newWinner;

    /// @dev unless it is not important for some reason, lets use `>` without `=` in this condition
    /// when we don't access equal values we gain two important things:
    /// 1. we save a lot of gas: we do not change state each time we have equal result
    /// 2. we encourage voters to vote asap, because in case of equal results, winner is the first one
    if (shardProposals > maxsVotes[_shard]) {

      // TODO once we know which of below scenarios is more likely to happen, we can adjust the code:
      // scenario 1 - in most cases winner will have much more votes that others
      // scenario 2 - in most cases election will be head-to-head
      // for (1) we might save gas, if we first check, if there is any change to winning proposal
      // for (2) we might save save gas if we do not check, just write
      if (roots[_shard] != _proposal) {
        roots[_shard] = _proposal;
        /// @dev flag for event
        newWinner = true;
      }

      /// @dev save new maximum
      maxsVotes[_shard] = shardProposals;
    }

    emit LogUpdateCounters(_shard, _proposal, shardProposals, newWinner);
  }


  /// @dev once voting is over we can send an information to `AbstractChain`
  function informAboutEnd()
  onlyAfter(revealEnd)
  external
  nonReentrant
  returns (bool) {

    require(!informAboutEndNonce);
    informAboutEndNonce = true;

    AbstractChain chain = AbstractChain(chainAddress);
    chain.electionCounted(this);

    emit LogInformAboutEnd(msg.sender, true);

    return true;
  }

}
