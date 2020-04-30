import { addHexPrefix, isValidAddress } from 'ethereumjs-util';
import { find, get, isEmpty, replace, toLower } from 'lodash';
import networkTypes from '../helpers/networkTypes';
import {
  add,
  convertNumberToString,
  fromWei,
  greaterThan,
  isZero,
  subtract,
} from '../helpers/utilities';
import { chains } from '../references';

const getEthPriceUnit = assets => {
  const ethAsset = getAsset(assets);
  return get(ethAsset, 'price.value', 0);
};

const getBalanceAmount = async (selectedGasPrice, selected) => {
  let amount = get(selected, 'balance.amount', 0);
  if (selected && selected.address === 'eth') {
    if (!isEmpty(selectedGasPrice)) {
      const txFeeRaw = get(selectedGasPrice, 'txFee.value.amount');
      const txFeeAmount = fromWei(txFeeRaw);
      const remaining = subtract(amount, txFeeAmount);
      amount = greaterThan(remaining, 0) ? remaining : '0';
    }
  }
  return amount;
};

const getAsset = (assets, address = 'eth') =>
  find(assets, asset => asset.address === address);

export const checkWalletEthZero = assets => {
  const ethAsset = find(assets, asset => asset.address === 'eth');
  let amount = get(ethAsset, 'balance.amount', 0);
  return isZero(amount);
};

/**
 * @desc remove hex prefix
 * @param  {String} hex
 * @return {String}
 */
const removeHexPrefix = hex => replace(toLower(hex), '0x', '');

/**
 * @desc pad string to specific width and padding
 * @param  {String} n
 * @param  {Number} width
 * @param  {String} z
 * @return {String}
 */
const padLeft = (n, width, z) => {
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
const getDataString = (func, arrVals) => {
  let val = '';
  for (let i = 0; i < arrVals.length; i++) val += padLeft(arrVals[i], 64);
  const data = func + val;
  return data;
};

/**
 * @desc get network string from chainId
 * @param  {Number} chainId
 */
const getNetworkFromChainId = chainId => {
  const networkData = find(chains, ['chain_id', chainId]);
  return get(networkData, 'network', networkTypes.mainnet);
};

/**
 * @desc get chainId from network string
 * @param  {String} network
 */
const getChainIdFromNetwork = network => {
  const chainData = find(chains, ['network', network]);
  return get(chainData, 'chain_id', 1);
};

/**
 * @desc get etherscan host from network string
 * @param  {String} network
 */
const getEtherscanHostFromNetwork = network => {
  const base_host = 'etherscan.io';
  if (network === networkTypes.mainnet) {
    return base_host;
  } else {
    return `${network}.${base_host}`;
  }
};

/**
 * @desc returns an object
 * @param  {Array} assets
 * @param  {String} assetAmount
 * @param  {String} gasPrice
 * @return {Object} ethereum, balanceAmount, balance, requestedAmount, txFeeAmount, txFee, amountWithFees
 */
const transactionData = (assets, assetAmount, gasPrice) => {
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

/**
 * @desc Checks if a string is a valid ethereum address
 * @param  {String} str
 * @return {Boolean}
 */
const isEthAddress = str => {
  const withHexPrefix = addHexPrefix(str);
  return isValidAddress(withHexPrefix);
};

export default {
  getAsset,
  getBalanceAmount,
  getChainIdFromNetwork,
  getDataString,
  getEtherscanHostFromNetwork,
  getEthPriceUnit,
  getNetworkFromChainId,
  isEthAddress,
  padLeft,
  removeHexPrefix,
  transactionData,
};
