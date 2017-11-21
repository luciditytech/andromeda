pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "token-sale-contracts/contracts/Token.sol";
import "token-sale-contracts/contracts/HumanStandardToken.sol";

contract Registrations is Ownable {
  address public tokenAddress = 0xc3057af6bde972e0ffbb8a22cc6153d64b4f72d7;

  function add() {
    Token token = Token(tokenAddress);
    uint256 tokensOwned = token.balanceOf(msg.sender);
    require(tokensOwned > 0);
  }

  /* owner only functions */
  function changeTokenAddress(address _newTokenAddress) 
    onlyOwner {
    tokenAddress = _newTokenAddress;
  }
}
