pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";
import "contracts/Registrations.sol";

// @title On-Chain voting of aggregated metrics
// @author Miguel Morales

contract Election is Ownable, ReentrancyGuard {
  address public registryAddress = 0xc3057af6bde972e0ffbb8a22cc6153d64b4f72d7;

  address public chairperson;
  mapping(address => Voter) public voters;
  address[] public addresses;
  mapping(address => mapping(bytes32 => bool)) voterSeen;
  mapping(bytes32 => mapping(uint256 => uint256)) counts;
  mapping(bytes32 => uint256) results;
  bytes32[] countedKeys;

  struct Voter {
    uint weight;
    bool voted;
    mapping(bytes32 => uint256) metrics;
    bytes32[] keys;
    uint256[] values;
    uint256 discrepancies;
  }

  function Election(address _chairperson) {
    chairperson = _chairperson;
    voters[chairperson].weight = 1;
  }

  function vote(bytes32[] _keys, uint256[] _values) external nonReentrant {
    require(_keys.length == _values.length);
    Voter sender = voters[msg.sender];
  	require(!sender.voted);

    for (uint256 i = 0; i < _keys.length; i++) {
      var key = _keys[i];
      var value = _values[i];
      require(!voterSeen[msg.sender][key]);
      sender.metrics[key] = value;
      voterSeen[msg.sender][key] = true;
    }

    sender.keys = _keys;
    sender.values = _values;
    sender.voted = true;
    addresses.push(msg.sender);
  }

  /* owner only functions */
  /*
    @notice Processes an election.
    @dev 
    By tallying all votes and determining the group of verifiers that have the most matching metrics. 
    It generates the following data structure to determine the group of winning and losing verifiers
    plus some data to know slashing penalties.

    Input: 
      {
        '0x12345' => {
          'cid::1234::pid::some.pub' => 1,
          'cid::1234::pid::otherr.pub' => 3
        },
        '0x7890' => {
          'cid::1234::pid::some.pub' => 1,
          'cid::1234::pid::otherr.pub' => 3
        },
        '0x14958' => {
          'cid::1234::pid::some.pub' => 1,
          'cid::1234::pid::otherr.pub' => 4
        },
        '0x379027' => {
          'cid::1234::pid::wtf.pub' => 100
        }
      }

    Step 1: Determine the 'correct' results for all known keys by counting the number of occurrences.
    Step 2: Determine the verifiers that had every one of their keys appear in the correct grouping.
    Step 3: Determine the verifiers that did not meet the criteria.
  */

  function unlock() public onlyOwner {
    countVotes();
    setCorrectValues();
    processVoters();
  }

  
  function countVotes() private onlyOwner {
    // count keys and their appearances by value
    for (uint256 i = 0; i < addresses.length; i++) {
      Voter voter = voters[addresses[i]];

      for (uint256 ii = 0; ii < voter.keys.length; ii++) {
        bytes32 key = voter.keys[ii];
        uint256 value = voter.values[ii];
        counts[key][value] += 1;
      }
    }
  }

  function setCorrectValues() private onlyOwner {
    // determine 'correct' values based on consensus
    for (uint256 x = 0; x < countedKeys.length; x++) {
      bytes32 key = countedKeys[x];
      uint256[] valuesSeen; //TODO
      uint256 correctValue = 0;
      uint256 maxTimesSeen = 0;

      for (uint256 v = 0; v < valuesSeen.length; v++) {
        uint256 valueSeen = valuesSeen[v];
        uint256 timesSeen = counts[key][valueSeen];

        if (timesSeen >= maxTimesSeen) {
          maxTimesSeen = timesSeen;
          correctValue = valueSeen;
        }
      }

      results[key] = correctValue;
    }
  }

  function processVoters() private {
    // determine who had all the 'correct', and who didn't
    for (uint256 i = 0; i < addresses.length; i++) {
      address voterAddress = addresses[i];
      Voter voter = voters[voterAddress];
      uint256 discrepancies = 0;

      for (uint256 z = 0; z < countedKeys.length; z++) {
        bytes32 key = countedKeys[z];
        uint256 correctValue = results[key];
        uint256 votedValue = voter.metrics[key];

        if (votedValue != correctValue) {
          voter.discrepancies += 1;
        }
      }
    }
  }

}
