pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";
import "contracts/Election.sol";

// @title Registry of election checkpoints
// @author Miguel Morales

contract Checkpoints is Ownable, ReentrancyGuard {
  mapping(bytes32 => address) elections;
  event NewElection(bytes32 key, address election);

  /* owner only functions */
  function start(bytes32 _key) onlyOwner {
    require(elections[_key] == address(0x0));
  	Election election = new Election(msg.sender, block.number);
  	NewElection(_key, election);
  }
}
