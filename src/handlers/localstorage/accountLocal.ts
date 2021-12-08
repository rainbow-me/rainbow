import { getAccountLocal, saveAccountLocal } from './common';

const assetPricesFromUniswapVersion = '0.1.0';
const assetsVersion = '0.2.0';
const purchaseTransactionsVersion = '0.1.0';
const savingsVersion = '0.2.0';
const transactionsVersion = '0.2.5';
const uniqueTokensVersion = '0.2.1';
const accountEmptyVersion = '0.1.0';

const ACCOUNT_INFO = 'accountInfo';
const ACCOUNT_EMPTY = 'accountEmpty';
const ASSET_PRICES_FROM_UNISWAP = 'assetPricesFromUniswap';
const ASSETS = 'assets';
const OPEN_FAMILIES = 'openFamilies';
const OPEN_INVESTMENT_CARDS = 'openInvestmentCards';
const PURCHASE_TRANSACTIONS = 'purchaseTransactions';
const SAVINGS = 'savings';
const SAVINGS_TOGGLE = 'savingsToggle';
const SHOWCASE_TOKENS = 'showcaseTokens';
const TRANSACTIONS = 'transactions';
const UNIQUE_TOKENS = 'uniquetokens';
const PINNED_COINS = 'pinnedCoins';
const HIDDEN_COINS = 'hiddenCoins';
const WEB_DATA_ENABLED = 'webDataEnabled';

export const accountLocalKeys = [
  ACCOUNT_INFO,
  ASSET_PRICES_FROM_UNISWAP,
  ASSETS,
  OPEN_FAMILIES,
  OPEN_INVESTMENT_CARDS,
  PURCHASE_TRANSACTIONS,
  SAVINGS,
  SAVINGS_TOGGLE,
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
  getAccountLocal(
    ACCOUNT_EMPTY,
    accountAddress,
    network,
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'false' is not assignable to para... Remove this comment to see the full error message
    false,
    accountEmptyVersion
  );

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
) =>
  saveAccountLocal(
    ACCOUNT_EMPTY,
    val,
    accountAddress,
    network,
    accountEmptyVersion
  );

/**
 * @desc get assets
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getAssets = (accountAddress: any, network: any) =>
  getAccountLocal(ASSETS, accountAddress, network, [], assetsVersion);

/**
 * @desc save assets
 * @param  {Array}    [assets]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveAssets = (assets: any, accountAddress: any, network: any) =>
  saveAccountLocal(ASSETS, assets, accountAddress, network, assetsVersion);

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
 * @desc get open savings
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getSavingsToggle = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'false' is not assignable to para... Remove this comment to see the full error message
  getAccountLocal(SAVINGS_TOGGLE, accountAddress, network, false);

/**
 * @desc save small balance toggle
 * @param  {String}   [address]
 * @param  {Boolean}    [small balance toggle]
 * @param  {String}   [network]
 */
export const saveSavingsToggle = (
  isOpen: any,
  accountAddress: any,
  network: any
) => saveAccountLocal(SAVINGS_TOGGLE, isOpen, accountAddress, network);

/**
 * @desc get open investment cards
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getOpenInvestmentCards = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
  getAccountLocal(OPEN_INVESTMENT_CARDS, accountAddress, network, {});

/**
 * @desc save open investment cards
 * @param  {String}   [address]
 * @param  {Object}    [open investment cards]
 * @param  {String}   [network]
 */
export const saveOpenInvestmentCards = (
  openInvestmentCards: any,
  accountAddress: any,
  network: any
) =>
  saveAccountLocal(
    OPEN_INVESTMENT_CARDS,
    openInvestmentCards,
    accountAddress,
    network
  );

/**
 * @desc get open families
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getOpenFamilies = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
  getAccountLocal(OPEN_FAMILIES, accountAddress, network, {});

/**
 * @desc save open families
 * @param  {String}   [address]
 * @param  {Object}    [open families]
 * @param  {String}   [network]
 */
export const saveOpenFamilies = (
  openFamilies: any,
  accountAddress: any,
  network: any
) => saveAccountLocal(OPEN_FAMILIES, openFamilies, accountAddress, network);

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
