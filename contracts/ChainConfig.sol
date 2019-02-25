pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/// @title Andromeda chain election configuration
/// @dev configuration methods for Chain contract
///      `proposeDuration` and `revealDuration` are durations in blocks (not timestamp).
contract ChainConfig is Ownable {

  bool public updateMinimumStakingTokenPercentageEnabled;

  using SafeMath for uint256;

  uint8 public blocksPerPhase;

  /// @dev address of `VerifierRegistry.sol`
  address public registryAddress;

  /// @dev required percent of all tokens for value for election tobe valid
  uint8 public minimumStakingTokenPercentage;

  modifier whenProposePhase() {
    require(getCurrentElectionCycleBlock() < blocksPerPhase, "we are not in propose phase");
    _;
  }
  modifier whenRevealPhase() {
    require(getCurrentElectionCycleBlock() >= blocksPerPhase, "we are not in reveal phase");
    _;
  }

  event LogChainConfig(uint8 blocksPerPhase, uint8 requirePercentOfTokens, bool updateMinimumStakingTokenPercentageEnabled);

  event LogUpdateRegistryAddress(address indexed newRegistryAddress);

  constructor (
    address _registryAddress,
    uint8 _blocksPerPhase,
    uint8 _minimumStakingTokenPercentage,
    bool _updateMinimumStakingTokenPercentageEnabled
  )
  public {

    require(_blocksPerPhase > 0, "_blocksPerPhase can't be empty");
    blocksPerPhase = _blocksPerPhase;

    require(_minimumStakingTokenPercentage > 0, "_minimumStakingTokenPercentage can't be empty");
    require(_minimumStakingTokenPercentage <= 100, "_minimumStakingTokenPercentage can't be over 100%");
    minimumStakingTokenPercentage = _minimumStakingTokenPercentage;

    updateMinimumStakingTokenPercentageEnabled = _updateMinimumStakingTokenPercentageEnabled;

    emit LogChainConfig(_blocksPerPhase, _minimumStakingTokenPercentage, _updateMinimumStakingTokenPercentageEnabled);


    require(_registryAddress != address(0), "registry address is empty");
    registryAddress = _registryAddress;

    emit LogUpdateRegistryAddress(_registryAddress);
  }

  function updateRegistryAddress(address _registryAddress)
  public
  onlyOwner
  returns (bool) {
    require(_registryAddress != address(0), "_registryAddress can't be empty");
    registryAddress = _registryAddress;
    emit LogUpdateRegistryAddress(_registryAddress);
    return true;
  }


  function updateMinimumStakingTokenPercentage(uint8 _minimumStakingTokenPercentage)
  public
  onlyOwner
  returns (bool) {
    require(updateMinimumStakingTokenPercentageEnabled, "update not available");

    require(_minimumStakingTokenPercentage > 0, "_minimumStakingTokenPercentage can't be empty");
    require(_minimumStakingTokenPercentage <= 100, "_minimumStakingTokenPercentage can't be over 100%");
    minimumStakingTokenPercentage = _minimumStakingTokenPercentage;

    emit LogChainConfig(blocksPerPhase, _minimumStakingTokenPercentage, true);

    return true;
  }


  /// @return current block number with reference to whole cycle,
  ///         returned value will be between [0..C), where C is sum of all phases durations
  function getCurrentElectionCycleBlock()
  public
  view
  returns (uint256) {
    return block.number % (uint256(blocksPerPhase) * 2);
  }

  /// @return first block number (blockchain block) of current cycle
  function getFirstCycleBlock()
  public
  view
  returns (uint256) {
    return block.number.sub(getCurrentElectionCycleBlock());
  }

}
