pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";
import "contracts/Election.sol";

contract Chain is Ownable {
  uint256 public blockNumber;
  Block[] public blocks;
  mapping(address => bool) public authorized;

  struct Block {
    uint256 number;
    address election;
  }

  event LogElectionStart(uint256 startsAt, uint256 endsAt, bytes32 root, address election);
  event LogElectionCount(address election, uint256 blockNumber);

  function authorize(address _sender) public {
    require(msg.sender == owner);
    authorized[_sender] = true;
  }

  function startElection(
    address _registryAddress,
    uint256 _startsAt,
    uint256 _endsAt,
    bytes32 _root,
    uint256 _votingTime,
    uint256 _revealTime
  ) public onlyOwner {
    Election election = new Election(
      _registryAddress,
      this,
      block.number,
      _root,
      _startsAt,
      _endsAt,
      _votingTime,
      _revealTime
    );

    authorize(election);
    emit LogElectionStart(_startsAt, _endsAt, _root, election);
  }

  function electionCounted(address _electionAddress) public {
    require(authorized[msg.sender]);

    Block memory newBlock = Block(
      {
        number: blockNumber,
        election: _electionAddress
      }
    );

    blocks.push(newBlock);
    blockNumber += 1;

    emit LogElectionCount(_electionAddress, blockNumber - 1);
  }
}
