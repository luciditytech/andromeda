import pify from 'pify';

const ethAsync = pify(web3.eth);

export const ethGetBalance = ethAsync.getBalance;
export const ethGetTransactionReceipt = ethAsync.getTransactionReceipt;
