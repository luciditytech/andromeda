pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "token-sale-contracts/contracts/Token.sol";
import "token-sale-contracts/contracts/HumanStandardToken.sol";

contract Registrations is Ownable {
  address public tokenAddress = 0x1588d300a9995934aa9daae19be285a66eb46c1c;
  uint256 minimum = 1000 * 1000000000;

  struct Verifier {
    address id;
    string fqdn;
    uint256 balance;
  }

  mapping(address => Verifier) public verifiers;
  address[] public addresses;

  function create(string _fqdn) {
    Token token = Token(tokenAddress);
    uint256 tokensOwned = token.balanceOf(msg.sender);
    require(tokensOwned > 0);
    require(verifiers[msg.sender].balance == 0);
    var approved = token.allowance(msg.sender, this);
    require(approved >= minimum);
    var res = token.transferFrom(msg.sender, this, approved);
    require(res == true);
    var verifier = Verifier(msg.sender, _fqdn, approved);
    verifiers[msg.sender] = verifier;
    addresses.push(msg.sender);
  }

  function getTokenAllowance() public constant returns (uint256) {
    Token token = Token(tokenAddress);
    return token.allowance(msg.sender, this);
  }

  function getBalanceOf(address _address) public constant returns (uint256) {
    var verifier = verifiers[_address];
    return verifier.balance;
  }

  function getNumberOfVerifiers() public constant returns (uint) {
    return addresses.length;
  }

  /* owner only functions */
  function changeTokenAddress(address _newTokenAddress) onlyOwner {
    tokenAddress = _newTokenAddress;
  }

  function changeMinimum(uint256 _newMinimum) onlyOwner {
    minimum = _newMinimum;
  }

  function remove(address _address) onlyOwner {
    Token token = Token(tokenAddress);
    var verifier = verifiers[_address];
    bool res = token.approve(_address, verifier.balance);
    if (!res) { revert(); }

    bool found = false;

    for (uint256 i = 0; i < addresses.length; i++) {
      var item = addresses[i];
      if (item == _address) { 
        delete addresses[i];
        found = true;
        break;
      }
    }

    if (!found) { revert(); }
    delete verifiers[msg.sender];
  }
}
