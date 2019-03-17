pragma solidity 0.5.0;

import "contract-registry/contracts/interfaces/IContractRegistry.sol";

contract ContractRegistry is IContractRegistry {
  mapping(bytes32 => IRegistrable) private _contractsByName;

  function add(IRegistrable _instance) external returns(bool) {
    bytes32 name = _instance.contractName();
    _contractsByName[name] = _instance;
  }

  function update(IRegistrable) external returns(bool) {
    require(false, "not implemented");
  }

  function contractByName(bytes32 _name) external view returns (address) {
    return address(_contractsByName[_name]);
  }
}
