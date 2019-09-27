import {
  getAccountLocal,
  getKey,
  getLocal,
  removeAccountLocal,
  saveAccountLocal,
  saveLocal,
} from './common';

const transactionsVersion = '0.2.0';
const uniqueTokensVersion = '0.2.0';
const assetsVersion = '0.2.0';

const ASSETS = 'assets';
const WALLET_EMPTY = 'iswalletempty';
const TRANSACTIONS = 'transactions';
const UNIQUE_TOKENS = 'uniquetokens';

/**
 * @desc get assets
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getAssets = (accountAddress, network) => getAccountLocal(ASSETS, accountAddress, network, [], assetsVersion);

/**
 * @desc save assets
 * @param  {String}   [address]
 * @param  {Array}    [assets]
 * @param  {String}   [network]
 */
export const saveAssets = (accountAddress, assets, network) => saveAccountLocal(
  ASSETS,
  assets,
  accountAddress,
  network,
  assetsVersion,
);

/**
 * @desc remove assets
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeAssets = (accountAddress, network) => removeAccountLocal(ASSETS, accountAddress, network, assetsVersion);

/**
 * @desc get transactions
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getLocalTransactions = (accountAddress, network) => getAccountLocal(TRANSACTIONS, accountAddress, network, [], transactionsVersion);

/**
 * @desc save transactions
 * @param  {String}   [address]
 * @param  {Array}   [transactions]
 * @param  {String}   [network]
 */
export const saveLocalTransactions = (accountAddress, transactions, network) => saveAccountLocal(
  TRANSACTIONS,
  transactions,
  accountAddress,
  network,
  transactionsVersion,
);

/**
 * @desc remove transactions
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeLocalTransactions = (accountAddress, network) => removeAccountLocal(TRANSACTIONS, accountAddress, network, transactionsVersion);

/**
 * @desc get is wallet empty
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Boolean}
 */
export const getIsWalletEmpty = async (accountAddress, network) => await getLocal(getKey(WALLET_EMPTY, accountAddress, network));

/**
 * @desc save is wallet empty
 * @param  {String}   [address]
 * @param  {Boolean}   [isWalletEmpty]
 * @param  {String}   [network]
 */
export const saveIsWalletEmpty = async (accountAddress, isWalletEmpty, network) => {
  await saveLocal(
    getKey(WALLET_EMPTY, accountAddress, network),
    isWalletEmpty,
  );
};

/**
 * @desc remove is wallet empty
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeIsWalletEmpty = (accountAddress, network) => removeAccountLocal(WALLET_EMPTY, accountAddress, network);

/**
 * @desc get unique tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getUniqueTokens = (accountAddress, network) => getAccountLocal(UNIQUE_TOKENS, accountAddress, network, [], uniqueTokensVersion);

/**
 * @desc save unique tokens
 * @param  {String}   [address]
 * @param  {Array}    [uniqueTokens]
 * @param  {String}   [network]
 */
export const saveUniqueTokens = (accountAddress, uniqueTokens, network) => saveAccountLocal(
  UNIQUE_TOKENS,
  uniqueTokens,
  accountAddress,
  network,
  uniqueTokensVersion,
);

/**
 * @desc remove unique tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeUniqueTokens = (accountAddress, network) => removeAccountLocal(UNIQUE_TOKENS, accountAddress, network, uniqueTokensVersion);
