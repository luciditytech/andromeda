pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "contracts/Registrations.sol";

contract Consensus is Ownable {
  address public registryAddress = 0xc3057af6bde972e0ffbb8a22cc6153d64b4f72d7;

  address public chairperson;
  mapping(address => Voter) public voters;
  address[] public addresses;
  
  struct Voter {
    uint weight;
    bool voted;
    mapping (bytes32 => uint256) values; 
  }

  function Consensus() {
    chairperson = msg.sender;
    voters[chairperson].weight = 1;
  }

  function vote(bytes32[] _keys, uint256[] _values) {
    require(_keys.length == _values.length);
    Voter sender = voters[msg.sender];
  	require(!sender.voted);

    for (uint256 i = 0; i < _keys.length; i++) {
      sender.values[_keys[i]] = _values[i];
    }

    sender.voted = true;
    addresses.push(msg.sender);
  }

  /* owner only functions */

  /*
    processes an election by tallying all votes and determining the group of verifiers
    that have the most matching metrics
  */
  function unlock() onlyOwner {
    for (uint i = 0; i < addresses.length; i++) {
      Voter voter = voters[addresses[i]];
    }
  }
}
