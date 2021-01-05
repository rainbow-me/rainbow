import { Wallet } from '@ethersproject/wallet';
import AsyncStorage from '@react-native-community/async-storage';
import { captureException } from '@sentry/react-native';
import { mnemonicToSeed } from 'bip39';
import {
  addHexPrefix,
  isValidAddress,
  toChecksumAddress,
} from 'ethereumjs-util';
import { hdkey } from 'ethereumjs-wallet';
import { find, get, isEmpty, matchesProperty, replace, toLower } from 'lodash';
import { NativeModules } from 'react-native';
import { ETHERSCAN_API_KEY } from 'react-native-dotenv';
import URL from 'url-parse';
import {
  DEFAULT_HD_PATH,
  identifyWalletType,
  WalletLibraryType,
} from '../model/wallet';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  fromWei,
  greaterThan,
  isZero,
  subtract,
} from '@rainbow-me/helpers/utilities';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { chains } from '@rainbow-me/references';
import logger from 'logger';

const { RNBip39 } = NativeModules;

const getEthPriceUnit = genericAssets => {
  return genericAssets?.eth?.price?.value || 0;
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
  find(assets, matchesProperty('address', toLower(address)));

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

const checkIfUrlIsAScam = async url => {
  try {
    const request = await fetch('https://api.cryptoscamdb.org/v1/scams');
    const { result } = await request.json();
    const { hostname } = new URL(url);
    const found = result.find(s => toLower(s.name) === toLower(hostname));
    if (found) {
      return true;
    }
    return false;
  } catch (e) {
    logger.sentry('Error fetching cryptoscamdb.org list');
    captureException(e);
  }
};

const deriveAccountFromMnemonic = async (mnemonic, index = 0) => {
  let seed;
  if (ios) {
    seed = await mnemonicToSeed(mnemonic);
  } else {
    const res = await RNBip39.mnemonicToSeed({ mnemonic, passphrase: null });
    seed = new Buffer(res, 'base64');
  }
  const hdWallet = hdkey.fromMasterSeed(seed);
  const root = hdWallet.derivePath(DEFAULT_HD_PATH);
  const child = root.deriveChild(index);
  const wallet = child.getWallet();
  return {
    address: toChecksumAddress(wallet.getAddress().toString('hex')),
    isHDWallet: true,
    root,
    type: WalletTypes.mnemonic,
    wallet,
    walletType: WalletLibraryType.bip39,
  };
};

const deriveAccountFromPrivateKey = privateKey => {
  const ethersWallet = new Wallet(addHexPrefix(privateKey));
  return {
    address: ethersWallet.address,
    isHDWallet: false,
    root: null,
    type: WalletTypes.privateKey,
    wallet: ethersWallet,
    walletType: WalletLibraryType.ethers,
  };
};

const deriveAccountFromWalletInput = input => {
  const type = identifyWalletType(input);
  if (type === WalletTypes.privateKey) {
    return deriveAccountFromPrivateKey(input);
  } else if (type === WalletTypes.readOnly) {
    const ethersWallet = { address: addHexPrefix(input), privateKey: null };
    return {
      address: addHexPrefix(input),
      isHDWallet: false,
      root: null,
      type: WalletTypes.readOnly,
      wallet: ethersWallet,
      walletType: WalletLibraryType.ethers,
    };
  }
  return deriveAccountFromMnemonic(input);
};

export default {
  checkIfUrlIsAScam,
  deriveAccountFromMnemonic,
  deriveAccountFromPrivateKey,
  deriveAccountFromWalletInput,
  getAsset,
  getBalanceAmount,
  getChainIdFromNetwork,
  getDataString,
  getEtherscanHostFromNetwork,
  getEthPriceUnit,
  getHash,
  getNetworkFromChainId,
  hasPreviousTransactions,
  isEthAddress,
  padLeft,
  removeHexPrefix,
};
