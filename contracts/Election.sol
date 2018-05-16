pragma solidity ^0.4.18;

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
  uint blockNumber;
  mapping(uint256 => mapping(bytes32 => uint256)) counts;
  bytes32 public previousRoot;
  mapping(uint256 => bytes32) roots;
  uint256 public startsAt;
  uint256 public endsAt;
  bool public counted;
  bool public revealed;
  uint256 public votingEnd;
  uint256 public revealEnd;

  struct Voter {
    bool voted;
    bytes32 blindedProposal;
    uint256 shard;
    bytes32 proposal;
    bool revealed;
  }

  modifier onlyBefore(uint _time) { if (now >= _time) throw; _; }
  modifier onlyAfter(uint _time) { if (now <= _time) throw; _; }

  function Election(
    address _registryAddress,
    address _chainAddress,
    address _chairperson,
    uint _blockNumber,
    bytes32 _previousRoot,
    uint256 _startsAt,
    uint256 _endsAt,
    uint256 _votingTime,
    uint _revealTime
  ) {
    registryAddress = _registryAddress;
    chainAddress = _chainAddress;
    chairperson = _chairperson;
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
    Voter sender = voters[msg.sender];
    require(!sender.voted);
    require(!blindedProposals[_blindedProposal]);

    VerifierRegistry registry = VerifierRegistry(registryAddress);
    var (id, location, created, balance, shard) = registry.verifiers(msg.sender);
    require(created);

    sender.blindedProposal = _blindedProposal;
    sender.voted = true;
    sender.shard = shard;
    blindedProposals[_blindedProposal] = true;
    addresses.push(msg.sender);
  }

  /*
   * operators/verifiers must provide the secret used to encrypt their proposal
   */
  function reveal(bytes32 _proposal, bytes32 _secret)
    onlyAfter(votingEnd)
    onlyBefore(revealEnd)
    external nonReentrant {
    Voter sender = voters[msg.sender];
    require(sender.voted);
    require(!sender.revealed);

    var proof = keccak256(_proposal, _secret);
    require(sender.blindedProposal == proof);

    sender.proposal = _proposal;
    sender.revealed = true;
  }

  /*
   * once all proposals have been revealed we can go count them and determine the winners
   */
  function count() onlyAfter(revealEnd) external nonReentrant {
    require(msg.sender == chairperson);
    require(!counted);

    uint256[] maxs;

    for (uint256 i = 0; i < addresses.length; i++) {
      Voter voter = voters[addresses[i]];
      if (!voter.revealed) { continue; }
      counts[voter.shard][voter.proposal] += 1;

      if (counts[voter.shard][voter.proposal] >= maxs[voter.shard]) {
        roots[voter.shard] = voter.proposal;
        maxs[voter.shard] = counts[voter.shard][voter.proposal];
      }
    }

    counted = true;

    AbstractChain chain = AbstractChain(chainAddress);
    chain.electionCounted(this);
  }
}
