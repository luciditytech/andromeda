pragma solidity 0.5.0;

import "digivice/contracts/interfaces/IVerifierRegistry.sol";
import "contract-registry/contracts/interfaces/IRegistrable.sol";

contract VerifierRegistry is IRegistrable {
  struct Verifier {
    bool active;
    uint256 balance;
    uint256 shard;
    bool enable;
  }

  mapping(address => Verifier) private _verifiers;
  mapping(uint256 => uint256) private _balancesPerShard;

  function setVerifier(
    address _verifier,
    bool _active,
    uint256 _balance,
    uint256 _shard,
    bool _enable
  )
  external {
    _balancesPerShard[_shard] += _balance;
    _verifiers[_verifier] = Verifier(_active, _balance, _shard, _enable);
  }

  function verifiers(address _verifier) external view returns (
    address id,
    string memory name,
    string memory location,
    bool active,
    uint256 balance,
    uint256 shard,
    bool enable
  ) {
    Verifier memory verifier = _verifiers[_verifier];

    return (
    address(0x0),
    "",
    "",
    verifier.active,
    verifier.balance,
    verifier.shard,
    verifier.enable
    );
  }

  function updateActiveStatus(address _verifier, bool _active) external {
    _verifiers[_verifier].active = _active;
  }

  function updateEnableStatus(address _verifier, bool _enable) external {
    _verifiers[_verifier].enable = _enable;
  }

  bytes32 constant NAME = "VerifierRegistry";

  function contractName() external view returns (bytes32) {
    return NAME;
  }

  function register() external returns (bool) {
    return true;
  }

  function balancesPerShard(uint256 _shard) external view returns (uint256) {
    return _balancesPerShard[_shard];
  }

  function uniqueNames(bytes32) external view returns (bool) {
    require(false, "not implemented");
  }

  function addresses(uint256) external view returns (address) {
    require(false, "not implemented");
  }

  function verifiersPerShard() external view returns (uint256) {
    require(false, "not implemented");
  }

  function isRegisteredVerifier(address) external view returns (bool) {
    require(false, "not implemented");
  }

  function increaseShardBalance(address _verifier, uint256 _amount) external returns (bool) {
    require(false, "not implemented");
  }

  function decreaseShardBalance(address _verifier, uint256 _amount) external returns (bool) {
    require(false, "not implemented");
  }

  function isRegistered() external view returns (bool) {
    require(false, "not implemented");
  }

  function unregister(IRegistrable _newInstance) external {
    require(false, "not implemented");
  }
}
