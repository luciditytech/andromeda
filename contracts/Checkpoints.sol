pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";
import "contracts/Election.sol";

// @title Registry of election checkpoints
// @author Miguel Morales

contract Checkpoints is Ownable, ReentrancyGuard {
  event NewElection(uint256 startsAt, uint256 endsAt, address election);

  /* owner only functions */
  function start(uint256 _startsAt, uint256 _endsAt) onlyOwner {
  	Election election = new Election(msg.sender, block.number);
  	NewElection(_startsAt, _endsAt, election);
  }
}
