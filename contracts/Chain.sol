pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";

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

  event NewBlock(
    address election,
    uint256 blockNumber
  );

  function mint(
    address _election,
    bytes32 _newRoot,
    bytes32[] _campaignIds,
    bytes32[] _channelIds,
    uint256[] _impressions,
    uint256[] _clicks,
    uint256[] _conversions
  ) {
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
    NewBlock(_election, blockNumber - 1);
  }

  function authorize(address _sender) {
    require(tx.origin == owner);
    authorized[_sender] = true;
  }
}
