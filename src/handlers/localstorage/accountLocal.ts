import { MMKV } from 'react-native-mmkv';
import { getAccountLocal, getKey, saveAccountLocal } from './common';
import { STORAGE_IDS } from '@rainbow-me/model/mmkv';

const accountAssetsDataVersion = '0.1.0';
const assetPricesFromUniswapVersion = '0.1.0';
const assetsVersion = '0.2.0';
const purchaseTransactionsVersion = '0.2.0';
const savingsVersion = '0.2.0';
const transactionsVersion = '0.2.5';
const uniqueTokensVersion = '0.2.1';

const ACCOUNT_ASSETS_DATA = 'accountAssetsData';
const ACCOUNT_INFO = 'accountInfo';
const ACCOUNT_EMPTY = 'accountEmpty';
const ASSET_PRICES_FROM_UNISWAP = 'assetPricesFromUniswap';
const ASSETS = 'assets';
const PURCHASE_TRANSACTIONS = 'purchaseTransactions';
const SAVINGS = 'savings';
const SHOWCASE_TOKENS = 'showcaseTokens';
const TRANSACTIONS = 'transactions';
const UNIQUE_TOKENS = 'uniquetokens';
const PINNED_COINS = 'pinnedCoins';
const HIDDEN_COINS = 'hiddenCoins';
const WEB_DATA_ENABLED = 'webDataEnabled';

const storage = new MMKV({
  id: STORAGE_IDS.ACCOUNT,
});

export const accountLocalKeys = [
  ACCOUNT_ASSETS_DATA,
  ACCOUNT_INFO,
  ASSET_PRICES_FROM_UNISWAP,
  ASSETS,
  PURCHASE_TRANSACTIONS,
  SAVINGS,
  SHOWCASE_TOKENS,
  TRANSACTIONS,
  UNIQUE_TOKENS,
  PINNED_COINS,
  HIDDEN_COINS,
  WEB_DATA_ENABLED,
];

/**
 * @desc get savings
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getSavings = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
  getAccountLocal(SAVINGS, accountAddress, network, {}, savingsVersion);

/**
 * @desc save savings
 * @param  {String}   [address]
 * @param  {Array}    [savings]
 * @param  {String}   [network]
 */
export const saveSavings = (savings: any, accountAddress: any, network: any) =>
  saveAccountLocal(SAVINGS, savings, accountAddress, network, savingsVersion);

/**
 * @desc get account empty state
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Boolean}
 */
export const getAccountEmptyState = (accountAddress: any, network: any) =>
  storage.getBoolean(getKey(ACCOUNT_EMPTY, accountAddress, network));

/**
 * @desc save account empty state
 * @param  {Boolean}    [val]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveAccountEmptyState = (
  val: any,
  accountAddress: any,
  network: any
) => storage.set(getKey(ACCOUNT_EMPTY, accountAddress, network), val);

/**
 * @desc get assets
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Array}
 */
export const getAssets = (accountAddress: any, network: any) =>
  getAccountLocal(ASSETS, accountAddress, network, [], assetsVersion);

/**
 * @desc get account assets data
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getAccountAssetsData = (accountAddress: any, network: any) =>
  getAccountLocal(
    ACCOUNT_ASSETS_DATA,
    accountAddress,
    network,
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
    {},
    accountAssetsDataVersion
  );

/**
 * @desc save account assets data
 * @param  {Object}   [accountAssetsData]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveAccountAssetsData = (
  accountAssetsData: any,
  accountAddress: any,
  network: any
) =>
  saveAccountLocal(
    ACCOUNT_ASSETS_DATA,
    accountAssetsData,
    accountAddress,
    network,
    accountAssetsDataVersion
  );

/**
 * @desc get asset prices from Uniswap
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getAssetPricesFromUniswap = (accountAddress: any, network: any) =>
  getAccountLocal(
    ASSET_PRICES_FROM_UNISWAP,
    accountAddress,
    network,
    [],
    assetPricesFromUniswapVersion
  );

/**
 * @desc save asset prices from Uniswap
 * @param  {String}   [address]
 * @param  {Array}    [assets]
 * @param  {String}   [network]
 */
export const saveAssetPricesFromUniswap = (
  assetPrices: any,
  accountAddress: any,
  network: any
) =>
  saveAccountLocal(
    ASSET_PRICES_FROM_UNISWAP,
    assetPrices,
    accountAddress,
    network,
    assetPricesFromUniswapVersion
  );

/**
 * @desc get purchase transactions
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getPurchaseTransactions = (accountAddress: any, network: any) =>
  getAccountLocal(
    PURCHASE_TRANSACTIONS,
    accountAddress,
    network,
    [],
    purchaseTransactionsVersion
  );

/**
 * @desc save purchase transactions
 * @param  {String}   [address]
 * @param  {Array}   [purchaseTransactions]
 * @param  {String}   [network]
 */
export const savePurchaseTransactions = (
  purchaseTransactions: any,
  accountAddress: any,
  network: any
) =>
  saveAccountLocal(
    PURCHASE_TRANSACTIONS,
    purchaseTransactions,
    accountAddress,
    network,
    purchaseTransactionsVersion
  );

/**
 * @desc get transactions
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getLocalTransactions = (accountAddress: any, network: any) =>
  getAccountLocal(
    TRANSACTIONS,
    accountAddress,
    network,
    [],
    transactionsVersion
  );

/**
 * @desc save transactions
 * @param  {String}   [address]
 * @param  {Array}   [transactions]
 * @param  {String}   [network]
 */
export const saveLocalTransactions = (
  transactions: any,
  accountAddress: any,
  network: any
) =>
  saveAccountLocal(
    TRANSACTIONS,
    transactions,
    accountAddress,
    network,
    transactionsVersion
  );

/**
 * @desc get unique tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getUniqueTokens = (accountAddress: any, network: any) =>
  getAccountLocal(
    UNIQUE_TOKENS,
    accountAddress,
    network,
    [],
    uniqueTokensVersion
  );

/**
 * @desc save unique tokens
 * @param  {String}   [address]
 * @param  {Array}    [uniqueTokens]
 * @param  {String}   [network]
 */
export const saveUniqueTokens = (
  uniqueTokens: any,
  accountAddress: any,
  network: any
) =>
  saveAccountLocal(
    UNIQUE_TOKENS,
    uniqueTokens,
    accountAddress,
    network,
    uniqueTokensVersion
  );

/**
 * @desc get profile info
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getAccountInfo = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
  getAccountLocal(ACCOUNT_INFO, accountAddress, network, {});

/**
 * @desc save profile info
 * @param  {String}   [address]
 * @param  {Object}    [profile info]
 * @param  {String}   [network]
 */
export const saveAccountInfo = (
  profileInfo: any,
  accountAddress: any,
  network: any
) => saveAccountLocal(ACCOUNT_INFO, profileInfo, accountAddress, network);

/**
 * @desc get pinned coins
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Array}
 */
export const getPinnedCoins = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
  getAccountLocal(PINNED_COINS, accountAddress, network, ['eth']);

/**
 * @desc save pinned coins
 * @param  {Array}    [pinned coins]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const savePinnedCoins = (
  pinnedCoins: any,
  accountAddress: any,
  network: any
) => saveAccountLocal(PINNED_COINS, pinnedCoins, accountAddress, network);

/**
 * @desc get hidden coins
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Array}
 */
export const getHiddenCoins = (accountAddress: any, network: any) =>
  getAccountLocal(HIDDEN_COINS, accountAddress, network, []);

/**
 * @desc save hidden coins
 * @param  {Array}    [hidden coins]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveHiddenCoins = (
  hiddenCoins: any,
  accountAddress: any,
  network: any
) => saveAccountLocal(HIDDEN_COINS, hiddenCoins, accountAddress, network);

/**
 * @desc get showcase tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Afray}
 */
export const getShowcaseTokens = (accountAddress: any, network: any) =>
  getAccountLocal(SHOWCASE_TOKENS, accountAddress, network, []);

/**
 * @desc save showcase tokens
 * @param  {String}   [address]
 * @param  {Array}    [Showcase tokens]
 * @param  {String}   [network]
 */
export const saveShowcaseTokens = (
  showcaseTokens: any,
  accountAddress: any,
  network: any
) => saveAccountLocal(SHOWCASE_TOKENS, showcaseTokens, accountAddress, network);

/**
 * @desc get web data enabled preference
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Array}
 */
export const getWebDataEnabled = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'null' is not assignable to param... Remove this comment to see the full error message
  getAccountLocal(WEB_DATA_ENABLED, accountAddress, network, null);

/**
 * @desc save web showcase enabled preference
 * @param  {Boolean}  [value]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveWebDataEnabled = (
  preference: any,
  accountAddress: any,
  network: any
) => saveAccountLocal(WEB_DATA_ENABLED, preference, accountAddress, network);
