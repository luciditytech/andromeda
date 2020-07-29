pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/cryptography/MerkleProof.sol";

import "./Chain.sol";
import "./ChainStorage.sol";

contract Voucher {
  function verifyProof(
    address _chainAddress,
    uint256 _blockHeight,
    uint256 _shard,
    bytes32 _leaf,
    bytes32[] memory _proof
  )
  public
  view
  returns (bool valid) {
    Chain chain = Chain(_chainAddress);
    bytes32 root = ChainStorage(address(chain.singleStorage)).getBlockRoot(_blockHeight, _shard);
    require(_blockHeight > 0, "block height must be positive");
    require(root != bytes32(0), "root for the given block is not valid");
  
    bool proven = MerkleProof.verify(
      _proof,
      root,
      _leaf
    );
  
    require(proven == true, "proof could not be verified");
    return true;
  }
}
