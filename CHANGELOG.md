# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased
### Changed:
- Cleaned up README to make project open source

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
