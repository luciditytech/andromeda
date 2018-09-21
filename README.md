# Andromeda Smart Contracts

A collection of contracts used for reaching off-chain consensus for marketing analytics
and distributing payments to participating verifiers.

## TODO
- in the future we probably need to add another roots to `Election struct Block {...}` 
i.e. for balances.
- create interface for `VerifierRegistry.sol`, so we can use it in `Chain.sol`. 
Using interface will save us gas.

## Overview

### Registration Process
TODO

### Election Process

Detailed description you can find at Slab: 
[election mechanism](https://lucidity.slab.com/posts/andromeda-election-mechanism-v-0-2-0-e9a79c2a).

General info:
* Election has two phases: propose and reveal. Duration of each is: N blocks. 
* Phases going cycle, every `N * 2` blocks new cycle start.
* Noone is in charge of starting phases, its self-controlled mechanism.   
* Each election root results are save to a block and kept on `Chain` contract at `blockHeight` index. 

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

## Testing smart contracts

* `truffle test` or `npm run test`
* check for linters errors: `npm run lint`

Please remember, that you can configure the `TestVerifiers.js` to use different number 
of verifiers for performing tests. Please run this test against different values i.e: 
1, 2 and 9.
 
* With code coverage: `npm run coverage`

### Issues during tests

* `Error: ENOENT: no such file or directory, open './allFiredEvents'`

If you experience above issue during coverage test, then create file 
`touch ./allFiredEvents` each time before you run test command, it should help.

* Test hang/freeze during execution  

I think this might be connected to the fact, that we mining a lot during tests 
to move from one to next phase. If this will happen, just cancel the test and run again.    

### Testing on testnet

This is tricky part, because you don't have access to build-in accounts full of ETH :)
You need to create accounts or use coinbase.   

Along with truffle console, you can use Ethereum wallet. 
It allows you to watch contracts (base on provided address and abi).
It will display you all events, help you use getter functions and also 
it will show you in real time current cycle block - this is helpful.  
Below some example screen, how it look like in Ethereum wallet:

 ![chain view](./eth-wallet-chain.png)
 
#### Testing in truffle console

The hard part here is that you need have verifier who has token balance. 
Below is a way how to do it:
 
In truffle console `truffle console --network ropsten`:
```
var chainAddr = '0x62Dcb16E90221B6312044efa7A073b2fed760a7F';
var registryAddr = '0x98db23cbd024fE31D06d496CBdf870000d51BB08';

var tokenAddr = registry.tokenAddress.call().then(addr => tokenAddress = addr);

var registry = VerifierRegistry.at(registryAddr);
var chain = Chain.at(chainAddr);
var humanToken = HumanStandardToken.at(tokenAddr);

# you can use any account as long as you can unlock it  
var verifier = eth.web3.accounts[0];
registry.create('192.168.8.8', { from: verifier }));
```

Lets check, if verifier has a balance
```
registry.verifiers(verifier).then(b => console.log(b[3].toString(10)));
```

If it has, then you are ready. If not, go ahead and execute below commands:
```
humanToken.transfer(verifier, 1);
humanToken.balanceOf(verifier).then(b => console.log(b.toString(10)));

humanToken.approve(registry.address, 1, { from: verifier });
humanToken.allowance(verifier, registry.address).then(b => console.log(b.toString(10)));

registry.receiveApproval(verifier, 0, tokenAddr, '');
registry.verifiers(verifier).then(b => console.log(b[3].toString(10)));
```
...and now you have one verifier ready to vote.

Example how to use Chain:

```
var blind;

# DO NO USE THIS IN REAL LIVE! everyone can see your secret!
chain.createProof('4', '4').then(res => blink = res);

chain.propose(blind);
chain.reveal('4', '4');
chain.getBlockRoot(255311,0);
```

### Deployment

For Test Net you can simple use this:  
```
truffle deploy --network ropsten
```

For Main Net I do recommend using ethereum wallet + bytecode. 
It will be much much faster and cheaper. 

#### Ropsten contracts

* development (8 blocks per phase) 
[0x62Dcb16E90221B6312044efa7A073b2fed760a7F](https://ropsten.etherscan.io/address/0x62Dcb16E90221B6312044efa7A073b2fed760a7F)
* staging (140 blocks per phase) 
[0x923afd068aed0156d788c10ea875656e095cbf4f](https://ropsten.etherscan.io/address/0x923afd068aed0156d788c10ea875656e095cbf4f)
* production (140 blocks per phase) 
[0xb2e0ac0e9f96eeb2c3f941e5b61666efbd40376e](https://ropsten.etherscan.io/address/0xb2e0ac0e9f96eeb2c3f941e5b61666efbd40376e)

## Licensed under MIT.

This code is licensed under MIT.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Notice

Except as contained in this notice, the name of the ZeroX Affiliate, LLC DBA Kr8os shall not be used in advertising or otherwise to promote the sale, use or other dealings in this Software without prior written authorization from ZeroX Affiliate, LLC DBA Kr8os.
