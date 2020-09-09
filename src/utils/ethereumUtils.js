import AsyncStorage from '@react-native-community/async-storage';
import BigNumber from 'bignumber.js';
import { addHexPrefix, isValidAddress } from 'ethereumjs-util';
import { find, get, isEmpty, matchesProperty, replace, toLower } from 'lodash';
import { ETHERSCAN_API_KEY } from 'react-native-dotenv';
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
  if (get(selected, 'address') === 'eth') {
    if (!isEmpty(selectedGasPrice)) {
      const txFeeRaw = get(selectedGasPrice, 'txFee.value.amount');
      const txFeeAmount = fromWei(txFeeRaw);
      const remaining = subtract(amount, txFeeAmount);
      amount = greaterThan(remaining, 0) ? remaining : '0';
    }
  }
  return amount;
};

const getHash = txn => txn.hash.split('-').shift();

const getAsset = (assets, address = 'eth') =>
  find(assets, matchesProperty('address', address));

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

const fetchTxWithAlwaysCache = async address => {
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&tag=oldest&page=1&offset=1&apikey=${ETHERSCAN_API_KEY}`;
  const cachedTxTime = await AsyncStorage.getItem(`first-tx-${address}`);
  if (cachedTxTime) {
    return cachedTxTime;
  }
  const response = await fetch(url);
  const parsedResponse = await response.json();
  const txTime = parsedResponse.result[0].timeStamp;
  AsyncStorage.setItem(`first-tx-${address}`, txTime);
  return txTime;
};

export const daysFromTheFirstTx = address => {
  return new Promise(async resolve => {
    try {
      if (address === 'eth') {
        resolve(1000);
        return;
      }
      const txTime = await fetchTxWithAlwaysCache(address);
      const daysFrom = Math.floor((Date.now() / 1000 - txTime) / 60 / 60 / 24);
      resolve(daysFrom);
    } catch (e) {
      resolve(1000);
    }
  });
};
/**
 * @desc Checks if a an address has previous transactions
 * @param  {String} address
 * @return {Promise<Boolean>}
 */
const hasPreviousTransactions = address => {
  return new Promise(async resolve => {
    try {
      const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&tag=latest&page=1&offset=1&apikey=${ETHERSCAN_API_KEY}`;
      const response = await fetch(url);
      const parsedResponse = await response.json();
      // Timeout needed to avoid the 5 requests / second rate limit of etherscan API
      setTimeout(() => {
        if (parsedResponse.status !== '0' && parsedResponse.result.length > 0) {
          resolve(true);
        }
        resolve(false);
      }, 260);
    } catch (e) {
      resolve(false);
    }
  });
};

const getEstimatedTimeForGasPrice = async gasPrice => {
  // We need to get this from redux!
  const blockTime = 10.6;
  const url = `https://ethgasstation.info/api/predictTable.json`;
  const response = await fetch(url);
  const data = await response.json();

  let delta = null;
  let expectedWait;
  let deltaIndex = null;
  let unsafe = false;
  data.forEach((item, i) => {
    const itemDelta = Math.abs(gasPrice - item.gasprice);
    if (delta === null || delta > itemDelta) {
      delta = itemDelta;
      expectedWait = item.expectedWait;
      deltaIndex = i;
      unsafe = item.unsafe;
    }
  });
  const estimateInSeconds = BigNumber(expectedWait)
    .times(Number(blockTime), 10)
    .toNumber();

  let symbol = '~';
  if (deltaIndex === 0) {
    symbol = '>';
  } else if (deltaIndex === data.length - 1) {
    symbol = '<';
  }

  console.log('estimateInSeconds', estimateInSeconds);
  let value = Math.round(estimateInSeconds);
  let unit = 'sec';
  if (estimateInSeconds > 60) {
    value = Math.floor(estimateInSeconds / 60);
    unit = 'min';

    if (value > 60) {
      value = Math.floor(value / 60);
      unit = 'hour';
      if (value > 1) {
        unit = 'hours';
      }
    }
  }

  return {
    symbol,
    unit,
    unsafe,
    value,
  };
};

export default {
  getAsset,
  getBalanceAmount,
  getChainIdFromNetwork,
  getDataString,
  getEstimatedTimeForGasPrice,
  getEtherscanHostFromNetwork,
  getEthPriceUnit,
  getHash,
  getNetworkFromChainId,
  hasPreviousTransactions,
  isEthAddress,
  padLeft,
  removeHexPrefix,
  transactionData,
};
