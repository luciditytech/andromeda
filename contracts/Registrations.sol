pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "token-sale-contracts/contracts/Token.sol";
import "token-sale-contracts/contracts/HumanStandardToken.sol";

contract Registrations is Ownable {
  address public tokenAddress = 0x1588d300a9995934aa9daae19be285a66eb46c1c;

  struct Verifier {
    address id;
    string location;
    bool active;
    bool created;
    uint256 balance;
  }

  mapping(address => Verifier) public verifiers;
  address[] public addresses;

  function create(string _location, bool _active) {
    require(!verifiers[msg.sender].created);
    verifiers[msg.sender].id = msg.sender;
    verifiers[msg.sender].location = _location;
    verifiers[msg.sender].active = _active;
    addresses.push(msg.sender);
  }

  function update(string _location, bool _active) {
    require(!verifiers[msg.sender].created);
    verifiers[msg.sender].location = _location;
    verifiers[msg.sender].active = _active;
  }

  function getNumberOfVerifiers() public constant returns (uint) {
    return addresses.length;
  }

  function withdraw(uint256 _value) returns (bool success) {
    var total = verifiers[msg.sender].balance;
    var newTotal = total - _value;
    require(newTotal >= 0);
    verifiers[msg.sender].balance = newTotal;
    Token token = Token(tokenAddress);
    var res = token.transfer(msg.sender, _value);
    if (!res) { revert(); }
    return res;
  }

  /* erc20 approval callback function */
  function receiveApproval(address _from, uint256 _value, address _token, bytes _data) returns (bool success) {
    Token token = Token(tokenAddress);
    var approved = token.allowance(_from, this);
    require(approved > 0);
    var res = token.transferFrom(_from, this, approved);
    if (!res) { revert(); }
    verifiers[_from].balance += approved;
    return true;
  }

  /* owner only functions */
  function changeTokenAddress(address _newTokenAddress) onlyOwner {
    tokenAddress = _newTokenAddress;
  }

  /* disable default methods */
  function() {throw;}
}
