pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "contract-registry/contracts/storage/StorageBase.sol";

contract StakingBankStorage is StorageBase {

  IERC20 public token;

  mapping (address => uint256) public stakingBalances;

  constructor(IERC20 _token) public {
    require(address(_token) != address(0x0), "empty token address");
    token = _token;
  }

  function setStakingBalance(address _verifier, uint256 _balance)
  external
  onlyFromStorageOwner {
    stakingBalances[_verifier] = _balance;
  }
}
