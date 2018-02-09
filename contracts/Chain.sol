pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";
import "contracts/Election.sol";

contract Chain is Ownable {
  uint256 public blockNumber;
  Block[] public blocks;
  mapping(address => bool) authorized;

  struct Block {
    uint256 number;
    address election;
    bytes32[] campaignIds;
    bytes32[] channelIds;
    uint256[] impressions;
    uint256[] clicks;
    uint256[] conversions;
  }

  event LogElectionStart(uint256 startsAt, uint256 endsAt, bytes32 root, address election);
  event LogElectionCount(address election);
  event LogElectionEnd(address election, uint256 blockNumber);

  function authorize(address _sender) public {
    require(tx.origin == owner);
    authorized[_sender] = true;
  }

  function startElection(
    address _registryAddress,
    uint256 _startsAt,
    uint256 _endsAt,
    bytes32 _root
  ) public onlyOwner {
    Election election = new Election(
      _registryAddress,
      this,
      owner,
      block.number,
      _root,
      _startsAt,
      _endsAt
    );

    authorize(election);
    LogElectionStart(_startsAt, _endsAt, _root, election);
  }

  function electionCounted(address _electionAddress) public {
    require(authorized[msg.sender]);
    LogElectionCount(_electionAddress);
  }

   function electionEnded(
     address _election,
     bytes32 _newRoot,
     bytes32[] _campaignIds,
     bytes32[] _channelIds,
     uint256[] _impressions,
     uint256[] _clicks,
     uint256[] _conversions
  ) public {
    require(authorized[msg.sender]);

    Block memory block = Block(
      {
        number: blockNumber,
        election: _election,
        campaignIds: _campaignIds,
        channelIds: _channelIds,
        impressions: _impressions,
        clicks: _clicks,
        conversions: _conversions
      }
    );

    blocks.push(block);
    blockNumber += 1;
    LogElectionEnd(_election, blockNumber - 1);
  }
}
