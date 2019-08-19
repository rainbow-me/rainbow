import { find, get } from 'lodash';
import chains from '../references/chains.json';
import {
  add,
  convertNumberToString,
  fromWei,
  greaterThan,
  subtract,
} from '../helpers/utilities';

export const getBalanceAmount = (gasPrice, selected) => {
  let amount = '';
  if (selected.address === 'eth') {
    const balanceAmount = get(selected, 'balance.amount', 0);
    const txFeeRaw = get(gasPrice, 'txFee.value.amount');
    const txFeeAmount = fromWei(txFeeRaw);
    const remaining = subtract(balanceAmount, txFeeAmount);
    amount = convertNumberToString(greaterThan(remaining, 0) ? remaining : 0);
  } else {
    amount = get(selected, 'balance.amount', 0);
  }
  return amount;
};

export const getAsset = (assets, address = 'eth') => find(assets, asset => asset.address === address);

/**
 * @desc remove hex prefix
 * @param  {String} hex
 * @return {String}
 */
export const removeHexPrefix = hex => hex.toLowerCase().replace('0x', '');

/**
 * @desc pad string to specific width and padding
 * @param  {String} n
 * @param  {Number} width
 * @param  {String} z
 * @return {String}
 */
export const padLeft = (n, width, z) => {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

/**
 * @desc get ethereum contract call data string
 * @param  {String} func
 * @param  {Array}  arrVals
 * @return {String}
 */
export const getDataString = (func, arrVals) => {
  let val = '';
  for (let i = 0; i < arrVals.length; i++) val += padLeft(arrVals[i], 64);
  const data = func + val;
  return data;
};

/**
 * @desc get network string from chainId
 * @param  {Number} chainId
 */
export const getNetworkFromChainId = (chainId) => {
  const networkData = find(chains, ['chain_id', chainId]);
  return get(networkData, 'network', 'mainnet');
};

/**
 * @desc get chainId from network string
 * @param  {String} network
 */
export const getChainIdFromNetwork = (network) => {
  const chainData = find(chains, ['network', network]);
  return get(chainData, 'chain_id', 1);
};

/**
 * @desc returns an object
 * @param  {Array} assets
 * @param  {String} assetAmount
 * @param  {String} gasPrice
 * @return {Object} ethereum, balanceAmount, balance, requestedAmount, txFeeAmount, txFee, amountWithFees
 */
export const transactionData = (assets, assetAmount, gasPrice) => {
  const ethereum = getAsset(assets);
  const balance = get(ethereum, 'balance.amount', 0);
  const requestedAmount = convertNumberToString(assetAmount);
  const txFee = fromWei(get(gasPrice, 'txFee.value.amount'));
  const amountWithFees = add(requestedAmount, txFee);

  return {
    amountWithFees,
    balance,
    ethereum,
    requestedAmount,
    txFee,
  };
};

export default {
  getAsset,
  getBalanceAmount,
  getChainIdFromNetwork,
  getDataString,
  getNetworkFromChainId,
  removeHexPrefix,
  transactionData,
};
