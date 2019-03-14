const ministroExecute = require('ministro-tool');
const BigNumber = require('bignumber.js');

const HumanStandardToken = artifacts.require('HumanStandardToken');

function MinistroContract() {
  const app = {};

  /* eslint-disable-next-line */
  app.__proto__ = ministroExecute();

  const tokenBalance = async (verifier) => {
    const erc20 = await HumanStandardToken.at(await app.token());
    return erc20.balanceOf.call(verifier);
  };

  app.withdraw = async (value, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);

    const action = () => app.instance.withdraw(value, txAttrLocal);

    let prevVerifierTokenBalance;
    let prevBankTokenBalance;
    let prevVerifierStakingBalance;

    if (!expectThrow) {
      prevVerifierTokenBalance = await tokenBalance(txAttrLocal.from);
      prevBankTokenBalance = await tokenBalance(app.instance.address);
      prevVerifierStakingBalance = await app.stakingBalance(txAttrLocal.from);
    }

    const results = await app.executeAction(action, txAttrLocal, null, null, expectThrow);

    if (!expectThrow) {
      assert(BigNumber(value).gt(0), 'value should be > 0');

      const verifierTokenBalance = await tokenBalance(txAttrLocal.from);
      const bankTokenBalance = await tokenBalance(app.instance.address);
      const verifierStakingBalance = await app.stakingBalance(txAttrLocal.from);

      assert(BigNumber(prevVerifierTokenBalance).plus(value).eq(verifierTokenBalance));
      assert(BigNumber(prevBankTokenBalance).minus(value).eq(bankTokenBalance));
      assert(BigNumber(prevVerifierStakingBalance).minus(value).eq(verifierStakingBalance));
    }

    return results;
  };

  app.receiveApproval = async (from, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);

    const action = () => app.instance.receiveApproval(from, txAttrLocal);

    return app.executeAction(action, txAttrLocal, null, null, expectThrow);
  };

  app.stakingBalance = async address => app.instance.stakingBalance.call(address);
  app.token = async () => app.instance.token.call();


  return app;
}

module.exports = MinistroContract;
