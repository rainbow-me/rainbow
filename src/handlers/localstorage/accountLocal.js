import {
  getAccountLocal,
  getKey,
  getLocal,
  removeAccountLocal,
  saveAccountLocal,
  saveLocal,
} from './common';

const assetPricesFromUniswapVersion = '0.1.0';
const assetsVersion = '0.2.0';
const purchaseTransactionsVersion = '0.1.0';
const savingsVersion = '0.1.0';
const transactionsVersion = '0.2.3';
const uniqueTokensVersion = '0.2.0';

const ACCOUNT_INFO = 'accountInfo';
const ASSET_PRICES_FROM_UNISWAP = 'assetPricesFromUniswap';
const ASSETS = 'assets';
const CHARTS = 'charts';
const OPEN_FAMILIES = 'openFamilies';
const OPEN_INVESTMENT_CARDS = 'openInvestmentCards';
const PURCHASE_TRANSACTIONS = 'purchaseTransactions';
const SMALL_BALANCE_TOGGLE = 'smallBalanceToggle';
const SAVINGS = 'savings';
const SAVINGS_TOGGLE = 'savingsToggle';
const SHOWCASE_TOKENS = 'showcaseTokens';
const TRANSACTIONS = 'transactions';
const UNIQUE_TOKENS = 'uniquetokens';
const WALLET_EMPTY = 'iswalletempty';
const PINNED_COINS = 'pinnedCoins';
const HIDDEN_COINS = 'hiddenCoins';

/**
 * @desc get savings
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getSavings = (accountAddress, network) =>
  getAccountLocal(SAVINGS, accountAddress, network, [], savingsVersion);

/**
 * @desc save savings
 * @param  {String}   [address]
 * @param  {Array}    [savings]
 * @param  {String}   [network]
 */
export const saveSavings = (savings, accountAddress, network) =>
  saveAccountLocal(SAVINGS, savings, accountAddress, network, savingsVersion);

/**
 * @desc get assets
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getAssets = (accountAddress, network) =>
  getAccountLocal(ASSETS, accountAddress, network, [], assetsVersion);

/**
 * @desc save assets
 * @param  {Array}    [assets]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveAssets = (assets, accountAddress, network) =>
  saveAccountLocal(ASSETS, assets, accountAddress, network, assetsVersion);

/**
 * @desc remove assets
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeAssets = (accountAddress, network) =>
  removeAccountLocal(ASSETS, accountAddress, network);

/**
 * @desc get asset prices from Uniswap
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getAssetPricesFromUniswap = (accountAddress, network) =>
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
  assetPrices,
  accountAddress,
  network
) =>
  saveAccountLocal(
    ASSET_PRICES_FROM_UNISWAP,
    assetPrices,
    accountAddress,
    network,
    assetPricesFromUniswapVersion
  );

/**
 * @desc remove asset from Uniswap
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeAssetPricesFromUniswap = (accountAddress, network) =>
  removeAccountLocal(ASSET_PRICES_FROM_UNISWAP, accountAddress, network);

/**
 * @desc get purchase transactions
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getPurchaseTransactions = (accountAddress, network) =>
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
  purchaseTransactions,
  accountAddress,
  network
) =>
  saveAccountLocal(
    PURCHASE_TRANSACTIONS,
    purchaseTransactions,
    accountAddress,
    network,
    purchaseTransactionsVersion
  );

/**
 * @desc get charts
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getCharts = (accountAddress, network) =>
  getAccountLocal(CHARTS, accountAddress, network, {});

/**
 * @desc save charts data
 * @param  {Object}   [charts]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveCharts = (charts, accountAddress, network) =>
  saveAccountLocal(CHARTS, charts, accountAddress, network);

/**
 * @desc remove charts data
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const removeCharts = (accountAddress, network) =>
  removeAccountLocal(CHARTS, accountAddress, network);

/**
 * @desc get transactions
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getLocalTransactions = (accountAddress, network) =>
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
export const saveLocalTransactions = (transactions, accountAddress, network) =>
  saveAccountLocal(
    TRANSACTIONS,
    transactions,
    accountAddress,
    network,
    transactionsVersion
  );

/**
 * @desc remove transactions
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeLocalTransactions = (accountAddress, network) =>
  removeAccountLocal(TRANSACTIONS, accountAddress, network);

/**
 * @desc get is wallet empty
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Boolean}
 */
export const getIsWalletEmpty = async (accountAddress, network) =>
  await getLocal(getKey(WALLET_EMPTY, accountAddress, network));

/**
 * @desc save is wallet empty
 * @param  {String}   [address]
 * @param  {Boolean}   [isWalletEmpty]
 * @param  {String}   [network]
 */
export const saveIsWalletEmpty = async (
  accountAddress,
  isWalletEmpty,
  network
) => {
  await saveLocal(getKey(WALLET_EMPTY, accountAddress, network), isWalletEmpty);
};

/**
 * @desc remove is wallet empty
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeIsWalletEmpty = (accountAddress, network) =>
  removeAccountLocal(WALLET_EMPTY, accountAddress, network);

/**
 * @desc get unique tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getUniqueTokens = (accountAddress, network) =>
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
export const saveUniqueTokens = (uniqueTokens, accountAddress, network) =>
  saveAccountLocal(
    UNIQUE_TOKENS,
    uniqueTokens,
    accountAddress,
    network,
    uniqueTokensVersion
  );

/**
 * @desc remove unique tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeUniqueTokens = (accountAddress, network) =>
  removeAccountLocal(UNIQUE_TOKENS, accountAddress, network);

/**
 * @desc get open small balances
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getSmallBalanceToggle = (accountAddress, network) =>
  getAccountLocal(SMALL_BALANCE_TOGGLE, accountAddress, network, false);

/**
 * @desc save small balance toggle
 * @param  {String}   [address]
 * @param  {Boolean}    [small balance toggle]
 * @param  {String}   [network]
 */
export const saveSmallBalanceToggle = (
  openSmallBalances,
  accountAddress,
  network
) =>
  saveAccountLocal(
    SMALL_BALANCE_TOGGLE,
    openSmallBalances,
    accountAddress,
    network
  );

/**
 * @desc remove small balance toggle
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeSmallBalanceToggle = (accountAddress, network) =>
  removeAccountLocal(SMALL_BALANCE_TOGGLE, accountAddress, network);

/**
 * @desc get open savings
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getSavingsToggle = (accountAddress, network) =>
  getAccountLocal(SAVINGS_TOGGLE, accountAddress, network, false);

/**
 * @desc save small balance toggle
 * @param  {String}   [address]
 * @param  {Boolean}    [small balance toggle]
 * @param  {String}   [network]
 */
export const saveSavingsToggle = (isOpen, accountAddress, network) =>
  saveAccountLocal(SAVINGS_TOGGLE, isOpen, accountAddress, network);

/**
 * @desc remove small balance toggle
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeSavingsToggle = (accountAddress, network) =>
  removeAccountLocal(SAVINGS_TOGGLE, accountAddress, network);

/**
 * @desc get open investment cards
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getOpenInvestmentCards = (accountAddress, network) =>
  getAccountLocal(OPEN_INVESTMENT_CARDS, accountAddress, network, {});

/**
 * @desc save open investment cards
 * @param  {String}   [address]
 * @param  {Object}    [open investment cards]
 * @param  {String}   [network]
 */
export const saveOpenInvestmentCards = (
  openInvestmentCards,
  accountAddress,
  network
) =>
  saveAccountLocal(
    OPEN_INVESTMENT_CARDS,
    openInvestmentCards,
    accountAddress,
    network
  );

/**
 * @desc remove open investment cards
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeOpenInvestmentCards = (accountAddress, network) =>
  removeAccountLocal(OPEN_INVESTMENT_CARDS, accountAddress, network);

/**
 * @desc get open families
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getOpenFamilies = (accountAddress, network) =>
  getAccountLocal(OPEN_FAMILIES, accountAddress, network, {});

/**
 * @desc save open families
 * @param  {String}   [address]
 * @param  {Object}    [open families]
 * @param  {String}   [network]
 */
export const saveOpenFamilies = (openFamilies, accountAddress, network) =>
  saveAccountLocal(OPEN_FAMILIES, openFamilies, accountAddress, network);

/**
 * @desc remove open families
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const removeOpenFamilies = (accountAddress, network) =>
  removeAccountLocal(OPEN_FAMILIES, accountAddress, network);

/**
 * @desc get profile info
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getAccountInfo = (accountAddress, network) =>
  getAccountLocal(ACCOUNT_INFO, accountAddress, network, {});

/**
 * @desc save profile info
 * @param  {String}   [address]
 * @param  {Object}    [profile info]
 * @param  {String}   [network]
 */
export const saveAccountInfo = (profileInfo, accountAddress, network) =>
  saveAccountLocal(ACCOUNT_INFO, profileInfo, accountAddress, network);

/**
 * @desc remove profile info
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const removeAccountInfo = (accountAddress, network) =>
  removeAccountLocal(ACCOUNT_INFO, accountAddress, network);

/**
 * @desc get pinned coins
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Array}
 */
export const getPinnedCoins = (accountAddress, network) =>
  getAccountLocal(PINNED_COINS, accountAddress, network, []);

/**
 * @desc save pinned coins
 * @param  {Array}    [pinned coins]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const savePinnedCoins = (pinnedCoins, accountAddress, network) =>
  saveAccountLocal(PINNED_COINS, pinnedCoins, accountAddress, network);

/**
 * @desc get hidden coins
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Array}
 */
export const getHiddenCoins = (accountAddress, network) =>
  getAccountLocal(HIDDEN_COINS, accountAddress, network, []);

/**
 * @desc save hidden coins
 * @param  {Array}    [hidden coins]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveHiddenCoins = (hiddenCoins, accountAddress, network) =>
  saveAccountLocal(HIDDEN_COINS, hiddenCoins, accountAddress, network);

/**
 * @desc get showcase tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Afray}
 */
export const getShowcaseTokens = (accountAddress, network) =>
  getAccountLocal(SHOWCASE_TOKENS, accountAddress, network, []);

/**
 * @desc save showcase tokens
 * @param  {String}   [address]
 * @param  {Array}    [Showcase tokens]
 * @param  {String}   [network]
 */
export const saveShowcaseTokens = (showcaseTokens, accountAddress, network) =>
  saveAccountLocal(SHOWCASE_TOKENS, showcaseTokens, accountAddress, network);

/**
 * @desc remove showcase tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const removeShowcaseTokens = (accountAddress, network) =>
  removeAccountLocal(SHOWCASE_TOKENS, accountAddress, network);
