# Andromeda Smart Contracts

A collection of contracts used for reaching off-chain consensus for marketing analytics
and distributing payments to participating verifiers.

## Overview

### Registration Process
TODO

### Election Process

* Every hour, a chairperson initiates an election process.
* An election process takes places which lasts for one block.
* A historical record of checkpoint elections is maintained by blockchain.

### Payment Process

## Development

---

### Prerequisites

1. [brew](http://brew.sh)

  ```sh
  ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
  ```

1. [HubFlow](http://datasift.github.io/gitflow/)

  ```sh
  brew install hubflow
  ```

---

## Setup

1. `npm install -g truffle`
1. `git clone git@github.com:kr8os/andromeda.git`
1. `npm install`
1. `git hf init`

### Launch RPC client

```
ganache-cli
```

#### Test with code coverage

Solidity coverage is configured to automatically run testrpc on port 8545.
Please remember to turn off other RPC client before you go for this test. 

### Compiling and migrating smart contracts

1. `truffle compile`
1. `truffle migrate`

### Testing smart contracts

1. `truffle test`
1. With code coverage: `./node_modules/.bin/solidity-coverage`

If you experience this issue during coverage test:
```
Error: ENOENT: no such file or directory, open './allFiredEvents'
```
create file `touch ./allFiredEvents` each time before you run test command, it should help.  
 

### Deployment

```
truffle deploy --network ropsten
```

## Licensed under MIT.

This code is licensed under MIT.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Notice

Except as contained in this notice, the name of the ZeroX Affiliate, LLC DBA Kr8os shall not be used in advertising or otherwise to promote the sale, use or other dealings in this Software without prior written authorization from ZeroX Affiliate, LLC DBA Kr8os.
