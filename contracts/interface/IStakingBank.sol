pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

interface IStakingBank {

  function withdraw(uint256 _value) external returns (bool);

  function receiveApproval(address, uint256, address, bytes calldata) external returns (bool);

  function stakingBalance(address _verifier) external view returns (uint256);

  function token() external view returns (IERC20);
}
