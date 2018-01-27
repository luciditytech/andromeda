pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";
import "contracts/Election.sol";
import "contracts/Chain.sol";

contract Commissioner is Ownable, ReentrancyGuard {
  event NewElection(uint256 startsAt, uint256 endsAt, address election);

  function startElection(
    address _registryAddress,
    address _chainAddress,
    uint256 _startsAt,
    uint256 _endsAt,
    bytes32 _root
  ) public nonReentrant onlyOwner {
    Election election = new Election(
      _registryAddress,
      _chainAddress,
      owner,
      block.number,
      _root,
      _startsAt,
      _endsAt
    );

    Chain chain = Chain(_chainAddress);
    chain.authorize(election);

    NewElection(_startsAt, _endsAt, election);
  }
}
