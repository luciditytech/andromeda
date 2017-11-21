pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "token-sale-contracts/contracts/Token.sol";
import "token-sale-contracts/contracts/HumanStandardToken.sol";

contract Registrations is Ownable {
  address public tokenAddress = 0xc3057af6bde972e0ffbb8a22cc6153d64b4f72d7;
  uint256 minimum = 1000;
  mapping(address => uint256) public balances;

  function add() {
    Token token = Token(tokenAddress);
    uint256 tokensOwned = token.balanceOf(msg.sender);
    require(tokensOwned > 0);
    require(balances[msg.sender] == 0);
    var approved = token.allowance(msg.sender, this);
    require(approved >= minimum);
    var res = token.transferFrom(msg.sender, this, approved);
    balances[msg.sender] = approved;
    require(res == true);
  }

  function getBalanceOf(address _address) returns (uint256) {
    return balances[_address];
  }

  /* owner only functions */
  function changeTokenAddress(address _newTokenAddress) onlyOwner {
    tokenAddress = _newTokenAddress;
  }

  function changeMinimum(uint256 _newMinimum) onlyOwner {
    minimum = _newMinimum;
  }

  function remove(address _address) onlyOwner returns (bool success) {
    Token token = Token(tokenAddress);
    return token.approve(_address, balances[msg.sender]);
  }
}
