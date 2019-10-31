# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased
### Changed
- duration of proposal phase is self-adjustable
- staking token percentage is keep for individual election

## [0.5.0] - 2019-10-29
### Added
- flattener script
- Proposals are made for specific `block-height`

### Changed
- test with fake dependencies

### Fixed:
- add missing public method `initialBlockHeights()`

## [0.4.0] - 2019-03-14
### Added
- option to update `minimumStakingTokenPercentage`.
- `initialBlockHeights` to set the initial block-height per shard
- fetch VerifierRegistry contract from ContractRegistry

### Changed
- smart contracts are complient with solidity 0.5
- unit tests are complient with web3 1.0
- when verifier proposing, `Chain` checks, if verifier is active instead
  of if it is only created.
- split Chain contract into two separate contracts (storage and manager)

## [0.3.0] - 2018-12-13
### Added:
- election verification

### Changed:
- Cleaned up README to make project open source
- Uses digivice repo for registry

## [0.2.0] - 2018-09-26
### Added:
- Properly checks for existing blinded proposals
- Uses pokedex's verifier registry
- Chain interface
- Getters for reading `blocks` structure
- update of contract code to be consistent with Solidity 0.4.24
- Remove commissioner and introduce election cycle with two phases: propose and reveal

## [0.1.0] - 2018-04-12
### Added:
- Election contract vote, reveal, count
- Chain contract start election and count election
