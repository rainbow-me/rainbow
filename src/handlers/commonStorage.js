import { differenceInMinutes } from 'date-fns';
import { omit, pickBy } from 'lodash';

const defaultVersion = '0.1.0';
const transactionsVersion = '0.2.0';
const uniqueTokensVersion = '0.2.0';
const assetsVersion = '0.2.0';

/**
 * @desc save to storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 */
export const saveLocal = async (
  key = '',
  data = {},
  version = defaultVersion,
) => {
  try {
    data.storageVersion = version;
    await storage.save({
      data,
      expires: null,
      key,
    });
  } catch (error) {
    console.log('Storage: error saving to local for key', key);
  }
};

/**
 * @desc get from storage
 * @param  {String}  [key='']
 * @return {Object}
 */
export const getLocal = async (key = '', version = defaultVersion) => {
  try {
    const result = await storage.load({
      autoSync: false,
      key,
      syncInBackground: false,
    });
    if (result && result.storageVersion === version) {
      return result;
    }
    if (result) {
      removeLocal(key);
      return null;
    }
    return null;
  } catch (error) {
    console.log('Storage: error getting from local for key', key);
    return null;
  }
};

/**
 * @desc get from storage
 * @param  {String}  [key='']
 * @return {Object}
 */
export const removeLocal = (key = '') => {
  try {
    storage.remove({ key });
  } catch (error) {
    console.log('Storage: error removing local with key', key);
  }
};

const getAssetsKey = (accountAddress, network) => `assets-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;
const getIsWalletEmptyKey = (accountAddress, network) => `iswalletempty-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;
const getRequestsKey = (accountAddress, network) => `requests-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;
const getTransactionsKey = (accountAddress, network) => `transactions-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;
const getUniqueTokensKey = (accountAddress, network) => `uniquetokens-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;
const getUniswapKey = (accountAddress, network) => `uniswap-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;
const getUniswapLiquidityKey = (accountAddress, network) => `uniswapliquidity-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;

/**
 * @desc get Uniswap liquidity tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getUniswapLiquidityTokens = async (accountAddress, network) => {
  const uniswap = await getLocal(getUniswapLiquidityKey(accountAddress, network));
  return uniswap ? uniswap.data : [];
};

/**
 * @desc save Uniswap liquidity tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveUniswapLiquidityTokens = async (accountAddress, uniswap, network) => {
  await saveLocal(
    getUniswapLiquidityKey(accountAddress, network),
    { data: uniswap },
  );
};

/**
 * @desc remove Uniswap liquidity tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeUniswapLiquidityTokens = (accountAddress, network) => {
  const key = getUniswapLiquidityKey(accountAddress, network);
  removeLocal(key);
};

/**
 * @desc get Uniswap
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getUniswap = async (accountAddress, network) => {
  const uniswap = await getLocal(getUniswapKey(accountAddress, network));
  return uniswap ? uniswap.data : {};
};

/**
 * @desc save Uniswap
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveUniswap = async (accountAddress, uniswap, network) => {
  await saveLocal(
    getUniswapKey(accountAddress, network),
    { data: uniswap },
  );
};

/**
 * @desc remove Uniswap
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeUniswap = (accountAddress, network) => {
  const key = getUniswapKey(accountAddress, network);
  removeLocal(key);
};

/**
 * @desc get assets
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getAssets = async (accountAddress, network) => {
  const assets = await getLocal(getAssetsKey(accountAddress, network), assetsVersion);
  return assets ? assets.data : [];
};

/**
 * @desc save assets
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveAssets = async (accountAddress, assets, network) => {
  await saveLocal(
    getAssetsKey(accountAddress, network),
    { data: assets },
    assetsVersion,
  );
};

/**
 * @desc remove assets
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeAssets = (accountAddress, network) => {
  const key = getAssetsKey(accountAddress, network);
  removeLocal(key, assetsVersion);
};

/**
 * @desc get transactions
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getLocalTransactions = async (accountAddress, network) => {
  const transactions = await getLocal(getTransactionsKey(accountAddress, network), transactionsVersion);
  return transactions ? transactions.data : [];
};

/**
 * @desc save transactions
 * @param  {String}   [address]
 * @param  {Array}   [transactions]
 * @param  {String}   [network]
 */
export const saveLocalTransactions = async (accountAddress, transactions, network) => {
  await saveLocal(
    getTransactionsKey(accountAddress, network),
    { data: transactions },
    transactionsVersion,
  );
};

/**
 * @desc remove transactions
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeLocalTransactions = (accountAddress, network) => {
  const key = getTransactionsKey(accountAddress, network);
  removeLocal(key, transactionsVersion);
};

/**
 * @desc get is wallet empty
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Boolean}
 */
export const getIsWalletEmpty = async (accountAddress, network) => await getLocal(getIsWalletEmptyKey(accountAddress, network));

/**
 * @desc save is wallet empty
 * @param  {String}   [address]
 * @param  {Boolean}   [isWalletEmpty]
 * @param  {String}   [network]
 */
export const saveIsWalletEmpty = async (accountAddress, isWalletEmpty, network) => {
  await saveLocal(
    getIsWalletEmptyKey(accountAddress, network),
    isWalletEmpty,
  );
};

/**
 * @desc remove is wallet empty
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeIsWalletEmpty = (accountAddress, network) => {
  const key = getIsWalletEmptyKey(accountAddress, network);
  removeLocal(key);
};

/**
 * @desc get unique tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getUniqueTokens = async (accountAddress, network) => {
  const uniqueTokens = await getLocal(getUniqueTokensKey(accountAddress, network), uniqueTokensVersion);
  return uniqueTokens ? uniqueTokens.data : [];
};

/**
 * @desc save unique tokens
 * @param  {String}   [address]
 * @param  {Array}   [uniqueTokens]
 * @param  {String}   [network]
 */
export const saveUniqueTokens = async (accountAddress, uniqueTokens, network) => {
  await saveLocal(
    getUniqueTokensKey(accountAddress, network),
    { data: uniqueTokens },
    uniqueTokensVersion,
  );
};

/**
 * @desc remove unique tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeUniqueTokens = (accountAddress, network) => {
  const key = getUniqueTokensKey(accountAddress, network);
  removeLocal(key, uniqueTokensVersion);
};

/**
 * @desc get native currency
 * @return {Object}
 */
export const getNativeCurrency = async () => {
  const nativeCurrency = await getLocal('nativeCurrency');
  const currency = nativeCurrency ? nativeCurrency.data : 'USD';
  if (currency === 'GBP') {
    await saveNativeCurrency('USD');
    return 'USD';
  }
  return currency;
};

/**
 * @desc save native currency
 * @param  {String}   [currency]
 */
export const saveNativeCurrency = async nativeCurrency => {
  await saveLocal(
    'nativeCurrency',
    { data: nativeCurrency },
  );
};

/**
 * @desc get all wallet connect sessions
 * @return {Object}
 */
export const getAllValidWalletConnectSessions = async () => {
  const allSessions = await getAllWalletConnectSessions();
  return pickBy(allSessions, value => value.connected);
};

/**
 * @desc get all wallet connect sessions
 * @return {Object}
 */
export const getAllWalletConnectSessions = async () => {
  const allSessions = await getLocal(
    'walletconnect',
  );
  return allSessions || {};
};

/**
 * @desc save wallet connect session
 * @param  {String}   [peerId]
 * @param  {Object}   [session]
 */
export const saveWalletConnectSession = async (peerId, session) => {
  const allSessions = await getAllValidWalletConnectSessions();
  allSessions[peerId] = session;
  await saveLocal('walletconnect', allSessions);
};

/**
 * @desc remove wallet connect session
 * @param  {String}   [peerId]
 */
export const removeWalletConnectSession = async (peerId) => {
  const allSessions = await getAllWalletConnectSessions();
  const session = allSessions ? allSessions[peerId] : null;
  const resultingSessions = omit(allSessions, [peerId]);
  await saveLocal('walletconnect', resultingSessions);
  return session;
};

/**
 * @desc remove wallet connect sessions
 * @param  {String}   [sessionId]
 */
export const removeWalletConnectSessions = async (sessionIds) => {
  const allSessions = await getAllWalletConnectSessions();
  const resultingSessions = omit(allSessions, sessionIds);
  await saveLocal('walletconnect', resultingSessions);
};

/**
 * @desc remove all wallet connect sessions
 * @param  {String}   [sessionId]
 */
export const removeWalletConnect = () => {
  removeLocal('walletconnect');
};

/**
 * @desc get language
 * @return {Object}
 */
export const getLanguage = async () => {
  const language = await getLocal('language');
  return language ? language.data : 'en';
};

/**
 * @desc save language
 * @param  {String}   [language]
 */
export const saveLanguage = async language => {
  await saveLocal('language', { data: language });
};

/**
 * @desc get show shitcoins setting
 * @return {True|False}
 */
export const getShowShitcoinsSetting = async () => {
  const showShitcoins = await getLocal('showShitcoins');
  return showShitcoins ? showShitcoins.data : null;
};

/**
 * @desc update show shitcoins setting
 * @param  {Boolean}   [updatedSetting]
 * @return {Void}
 */
export const updateShowShitcoinsSetting = async (updatedSetting) => {
  await saveLocal('showShitcoins', { data: updatedSetting });
};

const isRequestStillValid = (request) => {
  const createdAt = request.displayDetails.timestampInMs;
  return (differenceInMinutes(Date.now(), createdAt) < 60);
};

/**
 * @desc get account local requests
 * @param  {String}   [address]
 * @return {Object}
 */
export const getLocalRequests = async (accountAddress, network) => {
  const requestsData = await getLocal(getRequestsKey(accountAddress, network));
  const requests = requestsData ? requestsData.data : {};
  const openRequests = pickBy(requests, isRequestStillValid);
  await saveLocalRequests(accountAddress, network, openRequests);
  return openRequests;
};

/**
 * @desc save local incoming requests
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Void}
 */
export const saveLocalRequests = async (accountAddress, network, requests) => {
  await saveLocal(
    getRequestsKey(accountAddress, network),
    { data: requests },
  );
};

/**
 * @desc remove request
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @param  {String}   [requestId]
 * @return {Void}
 */
export const removeLocalRequest = async (address, network, requestId) => {
  const requests = await getLocalRequests(address, network);
  const updatedRequests = { ...requests };
  delete updatedRequests[requestId];
  await saveLocalRequests(address, network, updatedRequests);
};

/**
 * @desc remove all requests
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @param  {String}   [requestId]
 * @return {Void}
 */
export const removeLocalRequests = async (address, network) => {
  const requestsKey = getRequestsKey(address, network);
  await removeLocal(requestsKey);
};

// apple restricts number of times developers are allowed to throw
// the in-app AppStore Review interface.
// see here for more: https://github.com/oblador/react-native-store-review
export const getAppStoreReviewRequestCount = async () => {
  const count = await getLocal('appStoreReviewRequestCount');
  return count ? count.data : 0;
};

export const setAppStoreReviewRequestCount = async (newCount) => {
  await saveLocal('appStoreReviewRequestCount', { data: newCount });
};
