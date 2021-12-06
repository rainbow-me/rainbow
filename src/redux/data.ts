import { Mutex } from 'async-mutex';
import { getUnixTime, startOfMinute, sub } from 'date-fns';
import isValidDomain from 'is-valid-domain';
import {
  concat,
  filter,
  get,
  includes,
  isEmpty,
  isNil,
  keyBy,
  keys,
  map,
  mapKeys,
  mapValues,
  partition,
  property,
  remove,
  toLower,
  toUpper,
  uniqBy,
  values,
} from 'lodash';
import { uniswapClient } from '../apollo/client';
import {
  UNISWAP_24HOUR_PRICE_QUERY,
  UNISWAP_PRICES_QUERY,
} from '../apollo/queries';
/* eslint-disable-next-line import/no-cycle */
import { addCashUpdatePurchases } from './addCash';
import { addCoinsToHiddenList } from './editOptions';
import { decrementNonce, incrementNonce } from './nonceManager';
// eslint-disable-next-line import/no-cycle
import { uniqueTokensRefreshState } from './uniqueTokens';
/* eslint-disable-next-line import/no-cycle */
import { uniswapUpdateLiquidityTokens } from './uniswapLiquidity';
import {
  AssetTypes,
  TransactionDirections,
  TransactionStatusTypes,
  TransactionTypes,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
} from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/appEvents... Remove this comment to see the full error message
import appEvents from '@rainbow-me/handlers/appEvents';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/assets' o... Remove this comment to see the full error message
import { isL2Asset } from '@rainbow-me/handlers/assets';
import {
  getAssetPricesFromUniswap,
  getAssets,
  getLocalTransactions,
  saveAccountEmptyState,
  saveAssetPricesFromUniswap,
  saveAssets,
  saveLocalTransactions,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/localstor... Remove this comment to see the full error message
} from '@rainbow-me/handlers/localstorage/accountLocal';
import {
  getProviderForNetwork,
  isL2Network,
  web3Provider,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
} from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletType... Remove this comment to see the full error message
import WalletTypes from '@rainbow-me/helpers/walletTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { Navigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation/onNavig... Remove this comment to see the full error message
import { triggerOnSwipeLayout } from '@rainbow-me/navigation/onNavigationStateChange';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/networkTypes' or i... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/networkTypes';
import {
  getTitle,
  getTransactionLabel,
  parseAccountAssets,
  parseAsset,
  parseNewTransaction,
  parseTransactions,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/parsers' or its co... Remove this comment to see the full error message
} from '@rainbow-me/parsers';
import {
  coingeckoIdsFallback,
  DPI_ADDRESS,
  ETH_ADDRESS,
  ETH_COINGECKO_ID,
  shitcoins,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
} from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { delay, isZero, multiply } from '@rainbow-me/utilities';
import {
  ethereumUtils,
  getBlocksFromTimestamps,
  isLowerCaseMatch,
  TokensListenedCache,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const BACKUP_SHEET_DELAY_MS = 3000;

let pendingTransactionsHandle: any = null;
let genericAssetsHandle: any = null;
const TXN_WATCHER_MAX_TRIES = 60;
const TXN_WATCHER_MAX_TRIES_LAYER_2 = 200;
const TXN_WATCHER_POLL_INTERVAL = 5000; // 5 seconds
const GENERIC_ASSETS_REFRESH_INTERVAL = 60000; // 1 minute
const GENERIC_ASSETS_FALLBACK_TIMEOUT = 10000; // 10 seconds

export const COINGECKO_IDS_ENDPOINT =
  'https://api.coingecko.com/api/v3/coins/list?include_platform=true&asset_platform_id=ethereum';

// -- Constants --------------------------------------- //

const DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP =
  'data/DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP';
const DATA_UPDATE_ASSETS = 'data/DATA_UPDATE_ASSETS';
const DATA_UPDATE_GENERIC_ASSETS = 'data/DATA_UPDATE_GENERIC_ASSETS';
const DATA_UPDATE_ETH_USD = 'data/DATA_UPDATE_ETH_USD';
const DATA_UPDATE_ETH_USD_CHARTS = 'data/DATA_UPDATE_ETH_USD_CHARTS';
const DATA_UPDATE_PORTFOLIOS = 'data/DATA_UPDATE_PORTFOLIOS';
const DATA_UPDATE_TRANSACTIONS = 'data/DATA_UPDATE_TRANSACTIONS';
const DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION =
  'data/DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION';

const DATA_LOAD_ASSETS_REQUEST = 'data/DATA_LOAD_ASSETS_REQUEST';
const DATA_LOAD_ASSETS_SUCCESS = 'data/DATA_LOAD_ASSETS_SUCCESS';
const DATA_LOAD_ASSETS_FAILURE = 'data/DATA_LOAD_ASSETS_FAILURE';

const DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS =
  'data/DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS';

const DATA_LOAD_TRANSACTIONS_REQUEST = 'data/DATA_LOAD_TRANSACTIONS_REQUEST';
const DATA_LOAD_TRANSACTIONS_SUCCESS = 'data/DATA_LOAD_TRANSACTIONS_SUCCESS';
const DATA_LOAD_TRANSACTIONS_FAILURE = 'data/DATA_LOAD_TRANSACTIONS_FAILURE';

const DATA_ADD_NEW_TRANSACTION_SUCCESS =
  'data/DATA_ADD_NEW_TRANSACTION_SUCCESS';

const DATA_ADD_NEW_SUBSCRIBER = 'data/DATA_ADD_NEW_SUBSCRIBER';
const DATA_UPDATE_REFETCH_SAVINGS = 'data/DATA_UPDATE_REFETCH_SAVINGS';

const DATA_CLEAR_STATE = 'data/DATA_CLEAR_STATE';

const mutex = new Mutex();

const withRunExclusive = async (callback: any) =>
  await mutex.runExclusive(callback);

// -- Actions ---------------------------------------- //
export const dataLoadState = () => async (dispatch: any, getState: any) =>
  withRunExclusive(async () => {
    const { accountAddress, network } = getState().settings;
    try {
      const assetPricesFromUniswap = await getAssetPricesFromUniswap(
        accountAddress,
        network
      );
      dispatch({
        payload: assetPricesFromUniswap,
        type: DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS,
      });
      // eslint-disable-next-line no-empty
    } catch (error) {}
    try {
      dispatch({ type: DATA_LOAD_ASSETS_REQUEST });
      const assets = await getAssets(accountAddress, network);
      dispatch({
        payload: assets,
        type: DATA_LOAD_ASSETS_SUCCESS,
      });
    } catch (error) {
      dispatch({ type: DATA_LOAD_ASSETS_FAILURE });
    }
    try {
      dispatch({ type: DATA_LOAD_TRANSACTIONS_REQUEST });
      const transactions = await getLocalTransactions(accountAddress, network);
      dispatch({
        payload: transactions,
        type: DATA_LOAD_TRANSACTIONS_SUCCESS,
      });
    } catch (error) {
      dispatch({ type: DATA_LOAD_TRANSACTIONS_FAILURE });
    }
    genericAssetsHandle = setTimeout(() => {
      dispatch(genericAssetsFallback());
    }, GENERIC_ASSETS_FALLBACK_TIMEOUT);
  });

export const fetchAssetPricesWithCoingecko = async (
  coingeckoIds: any,
  nativeCurrency: any
) => {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds
      .filter((val: any) => !!val)
      .sort()
      .join(
        ','
      )}&vs_currencies=${nativeCurrency}&include_24hr_change=true&include_last_updated_at=true`;
    const priceRequest = await fetch(url);
    return priceRequest.json();
  } catch (e) {
    logger.log(`Error trying to fetch ${coingeckoIds} prices`, e);
  }
};

export const fetchCoingeckoIds = async () => {
  let ids;
  try {
    const request = await fetch(COINGECKO_IDS_ENDPOINT);
    ids = await request.json();
  } catch (e) {
    ids = coingeckoIdsFallback;
  }

  const idsMap = {};
  ids.forEach(({ id, platforms: { ethereum: tokenAddress } }: any) => {
    const address = tokenAddress && toLower(tokenAddress);
    if (address && address.substr(0, 2) === '0x') {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      idsMap[address] = id;
    }
  });
  return idsMap;
};

const genericAssetsFallback = () => async (dispatch: any, getState: any) => {
  logger.log('ZERION IS DOWN! ENABLING GENERIC ASSETS FALLBACK');
  const { nativeCurrency } = getState().settings;
  const formattedNativeCurrency = toLower(nativeCurrency);
  let ids: any;
  try {
    const request = await fetch(COINGECKO_IDS_ENDPOINT);
    ids = await request.json();
  } catch (e) {
    ids = coingeckoIdsFallback;
  }

  const allAssets = [
    {
      asset_code: ETH_ADDRESS,
      coingecko_id: ETH_COINGECKO_ID,
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    {
      asset_code: DPI_ADDRESS,
      coingecko_id: 'defipulse-index',
      decimals: 18,
      name: 'DefiPulse Index',
      symbol: 'DPI',
    },
  ];

  keys(TokensListenedCache?.[nativeCurrency]).forEach(address => {
    const coingeckoAsset = ids.find(
      // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'tokenAddress' implicitly has an '... Remove this comment to see the full error message
      ({ platforms: { ethereum: tokenAddress } }) =>
        toLower(tokenAddress) === address
    );

    if (coingeckoAsset) {
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ asset_code: string; coingecko_... Remove this comment to see the full error message
      allAssets.push({
        asset_code: address,
        coingecko_id: coingeckoAsset?.id,
        name: coingeckoAsset.name,
        symbol: toUpper(coingeckoAsset.symbol),
      });
    }
  });

  const allAssetsUnique = uniqBy(allAssets, token => token.asset_code);

  let prices = {};
  const pricePageSize = 80;
  const pages = Math.ceil(allAssetsUnique.length / pricePageSize);
  try {
    for (let currentPage = 0; currentPage < pages; currentPage++) {
      const from = currentPage * pricePageSize;
      const to = from + pricePageSize;
      const currentPageIds = allAssetsUnique
        .slice(from, to)
        .map(({ coingecko_id }) => coingecko_id);

      const pricesForCurrentPage = await fetchAssetPricesWithCoingecko(
        currentPageIds,
        formattedNativeCurrency
      );
      await delay(1000);
      prices = { ...prices, ...pricesForCurrentPage };
    }
  } catch (e) {
    logger.sentry('error loading generic asset prices from coingecko', e);
  }

  if (!isEmpty(prices)) {
    Object.keys(prices).forEach(key => {
      for (let i = 0; i < allAssetsUnique.length; i++) {
        if (toLower(allAssetsUnique[i].coingecko_id) === toLower(key)) {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'price' does not exist on type '{ asset_c... Remove this comment to see the full error message
          allAssetsUnique[i].price = {
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            changed_at: prices[key].last_updated_at,
            relative_change_24h:
              // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
              prices[key][`${formattedNativeCurrency}_24h_change`],
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            value: prices[key][`${formattedNativeCurrency}`],
          };
          break;
        }
      }
    });
  }

  const allPrices = {};

  allAssetsUnique.forEach(asset => {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    allPrices[asset.asset_code] = asset;
  });

  dispatch(
    assetPricesReceived(
      {
        meta: {
          currency: 'usd',
          status: 'ok',
        },
        payload: { prices: allPrices },
      },
      true
    )
  );

  genericAssetsHandle = setTimeout(() => {
    logger.log('updating generic assets via fallback');
    dispatch(genericAssetsFallback());
  }, GENERIC_ASSETS_REFRESH_INTERVAL);
};

const disableGenericAssetsFallbackIfNeeded = () => {
  if (genericAssetsHandle) {
    clearTimeout(genericAssetsHandle);
  }
};

export const dataResetState = () => (dispatch: any, getState: any) => {
  const { uniswapPricesSubscription } = getState().data;
  uniswapPricesSubscription &&
    uniswapPricesSubscription.unsubscribe &&
    uniswapPricesSubscription.unsubscribe();
  pendingTransactionsHandle && clearTimeout(pendingTransactionsHandle);
  genericAssetsHandle && clearTimeout(genericAssetsHandle);
  dispatch({ type: DATA_CLEAR_STATE });
};

export const dataUpdateAssets = (assets: any) => (
  dispatch: any,
  getState: any
) => {
  const { accountAddress, network } = getState().settings;
  if (assets.length) {
    saveAssets(assets, accountAddress, network);
    // Change the state since the account isn't empty anymore
    saveAccountEmptyState(false, accountAddress, network);
    dispatch({
      payload: assets,
      type: DATA_UPDATE_ASSETS,
    });
  }
};

const checkMeta = (message: any) => (dispatch: any, getState: any) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const address = message?.meta?.address;
  const currency = message?.meta?.currency;
  return (
    isLowerCaseMatch(address, accountAddress) &&
    isLowerCaseMatch(currency, nativeCurrency)
  );
};

const checkForConfirmedSavingsActions = (transactionsData: any) => (
  dispatch: any
) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'find'.
  const foundConfirmedSavings = find(
    transactionsData,
    (transaction: any) =>
      (transaction?.type === 'deposit' || transaction?.type === 'withdraw') &&
      transaction?.status === 'confirmed'
  );
  if (foundConfirmedSavings) {
    dispatch(updateRefetchSavings(true));
  }
};

const checkForUpdatedNonce = (transactionData: any) => (dispatch: any) => {
  const txSortedByDescendingNonce = transactionData.sort(
    // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'n1' implicitly has an 'any' type.
    ({ nonce: n1 }, { nonce: n2 }) => n2 - n1
  );
  const [latestTx] = txSortedByDescendingNonce;
  const { address_from, network, nonce } = latestTx;
  dispatch(incrementNonce(address_from, nonce, network));
};

const checkForRemovedNonce = (removedTransactions: any) => (dispatch: any) => {
  const txSortedByAscendingNonce = removedTransactions.sort(
    // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'n1' implicitly has an 'any' type.
    ({ nonce: n1 }, { nonce: n2 }) => n1 - n2
  );
  const [lowestNonceTx] = txSortedByAscendingNonce;
  const { address_from, network, nonce } = lowestNonceTx;
  dispatch(decrementNonce(address_from, nonce, network));
};

export const portfolioReceived = (message: any) => async (
  dispatch: any,
  getState: any
) => {
  if (message?.meta?.status !== 'ok') return;
  if (!message?.payload?.portfolio) return;

  const { portfolios } = getState().data;

  const newPortfolios = { ...portfolios };
  newPortfolios[message.meta.address] = message.payload.portfolio;

  dispatch({
    payload: newPortfolios,
    type: DATA_UPDATE_PORTFOLIOS,
  });
};

export const transactionsReceived = (message: any, appended = false) => async (
  dispatch: any,
  getState: any
) =>
  withRunExclusive(async () => {
    const isValidMeta = dispatch(checkMeta(message));
    if (!isValidMeta) return;
    const transactionData = message?.payload?.transactions ?? [];
    if (appended) {
      dispatch(checkForConfirmedSavingsActions(transactionData));
    }
    await dispatch(checkForUpdatedNonce(transactionData));

    const { accountAddress, nativeCurrency, network } = getState().settings;
    const { purchaseTransactions } = getState().addCash;
    const { transactions } = getState().data;
    const { selected } = getState().wallets;

    const {
      parsedTransactions,
      potentialNftTransaction,
    } = await parseTransactions(
      transactionData,
      accountAddress,
      nativeCurrency,
      transactions,
      purchaseTransactions,
      network,
      appended
    );
    if (appended && potentialNftTransaction) {
      setTimeout(() => {
        dispatch(uniqueTokensRefreshState());
      }, 60000);
    }
    dispatch({
      payload: parsedTransactions,
      type: DATA_UPDATE_TRANSACTIONS,
    });
    dispatch(updatePurchases(parsedTransactions));
    saveLocalTransactions(parsedTransactions, accountAddress, network);

    if (appended && parsedTransactions.length) {
      if (
        selected &&
        !selected.backedUp &&
        !selected.imported &&
        selected.type !== WalletTypes.readOnly
      ) {
        setTimeout(() => {
          triggerOnSwipeLayout(() =>
            Navigation.handleAction(Routes.BACKUP_SHEET, { single: true })
          );
        }, BACKUP_SHEET_DELAY_MS);
      }
    }
  });

export const transactionsRemoved = (message: any) => async (
  dispatch: any,
  getState: any
) =>
  withRunExclusive(() => {
    const isValidMeta = dispatch(checkMeta(message));
    if (!isValidMeta) return;

    const transactionData = message?.payload?.transactions ?? [];
    if (!transactionData.length) {
      return;
    }
    const { accountAddress, network } = getState().settings;
    const { transactions } = getState().data;
    const removeHashes = map(transactionData, txn => txn.hash);
    logger.log('[data] - remove txn hashes', removeHashes);
    const [updatedTransactions, removedTransactions] = partition(
      transactions,
      txn => !includes(removeHashes, ethereumUtils.getHash(txn))
    );

    dispatch({
      payload: updatedTransactions,
      type: DATA_UPDATE_TRANSACTIONS,
    });
    dispatch(checkForRemovedNonce(removedTransactions));
    saveLocalTransactions(updatedTransactions, accountAddress, network);
  });

export const addressAssetsReceived = (
  message: any,
  append = false,
  change = false,
  removed = false,
  assetsNetwork = null
) => (dispatch: any, getState: any) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;
  const { accountAddress, network } = getState().settings;
  const { uniqueTokens } = getState().uniqueTokens;
  const payload = values(message?.payload?.assets ?? {});
  let assets = filter(
    payload,
    asset =>
      asset?.asset?.type !== AssetTypes.compound &&
      asset?.asset?.type !== AssetTypes.trash
  );

  if (removed) {
    assets = map(payload, asset => {
      return {
        ...asset,
        quantity: 0,
      };
    });
  }

  // Remove spammy tokens
  remove(assets, asset =>
    shitcoins.includes(toLower(asset?.asset?.asset_code))
  );

  let parsedAssets = parseAccountAssets(assets, uniqueTokens);

  // remove V2 LP tokens
  const liquidityTokens = remove(
    parsedAssets,
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    asset => asset?.type === AssetTypes.uniswapV2
  );

  const isL2 = assetsNetwork && isL2Network(assetsNetwork);
  if (!isL2 && !assetsNetwork) {
    dispatch(
      uniswapUpdateLiquidityTokens(liquidityTokens, append || change || removed)
    );
  }

  const { assets: existingAssets } = getState().data;
  if (append || change || removed) {
    parsedAssets = uniqBy(
      concat(parsedAssets, existingAssets),
      item => item.uniqueId
    );
  } else if (isL2) {
    // We need to replace all the assets for that network completely
    const { assets: existingAssets } = getState().data;
    const restOfTheAssets = existingAssets.filter(
      (asset: any) => asset.network !== assetsNetwork
    );
    parsedAssets = concat(parsedAssets, restOfTheAssets);
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    parsedAssets = uniqBy(parsedAssets, item => item.uniqueId);
  } else {
    // We need to merge the response with all l2 assets
    // to prevent L2 assets temporarily dissapearing
    const { assets: existingAssets } = getState().data;
    const l2Assets = existingAssets.filter((asset: any) =>
      isL2Asset(asset.type)
    );
    parsedAssets = uniqBy(
      network === networkTypes.mainnet
        ? concat(parsedAssets, l2Assets)
        : parsedAssets,
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      item => item.uniqueId
    );
  }

  parsedAssets = parsedAssets.filter(
    (asset: any) => !!Number(asset?.balance?.amount)
  );

  saveAssets(parsedAssets, accountAddress, network);
  if (parsedAssets.length > 0) {
    // Change the state since the account isn't empty anymore
    saveAccountEmptyState(false, accountAddress, network);
  }

  dispatch({
    payload: parsedAssets,
    type: DATA_UPDATE_ASSETS,
  });
  if (!change) {
    const missingPriceAssetAddresses = map(
      filter(parsedAssets, asset => isNil(asset.price)),
      property('address')
    );
    dispatch(subscribeToMissingPrices(missingPriceAssetAddresses));
  }

  //Hide tokens with a url as their token name
  const assetsWithScamURL = parsedAssets
    .filter((asset: any) => isValidDomain(asset.name) && !asset.isVerified)
    .map(({ uniqueId }: any) => uniqueId);
  dispatch(addCoinsToHiddenList(assetsWithScamURL));

  // Hide coins with price = 0 that are currently not pinned
  if (isL2) {
    const assetsWithNoPrice = parsedAssets
      .filter(
        (asset: any) =>
          asset.price?.value === 0 && asset.network === assetsNetwork
      )
      .map(({ uniqueId }: any) => uniqueId);
    dispatch(addCoinsToHiddenList(assetsWithNoPrice));
  }
};

const subscribeToMissingPrices = (addresses: any) => (
  dispatch: any,
  getState: any
) => {
  const { accountAddress, network } = getState().settings;
  const { uniswapPricesQuery } = getState().data;

  if (uniswapPricesQuery) {
    uniswapPricesQuery.refetch({ addresses });
  } else {
    const newQuery = uniswapClient.watchQuery({
      fetchPolicy: 'no-cache',
      pollInterval: 15000, // 15 seconds
      query: UNISWAP_PRICES_QUERY,
      variables: {
        addresses,
      },
    });

    const newSubscription = newQuery.subscribe({
      next: async ({ data }) => {
        try {
          if (data?.tokens) {
            const nativePriceOfEth = ethereumUtils.getEthPriceUnit();
            const tokenAddresses = map(data.tokens, property('id'));

            const yesterday = getUnixTime(
              startOfMinute(sub(Date.now(), { days: 1 }))
            );
            const [{ number: yesterdayBlock }] = await getBlocksFromTimestamps([
              yesterday,
            ]);

            const historicalPriceCalls = map(tokenAddresses, address =>
              get24HourPrice(address, yesterdayBlock)
            );
            const historicalPriceResults = await Promise.all(
              historicalPriceCalls
            );
            const mappedHistoricalData = keyBy(historicalPriceResults, 'id');
            const { chartsEthUSDDay } = getState().charts;
            const ethereumPriceOneDayAgo = chartsEthUSDDay?.[0]?.[1];

            const missingHistoricalPrices = mapValues(
              mappedHistoricalData,
              value => multiply(ethereumPriceOneDayAgo, value?.derivedETH)
            );

            const mappedPricingData = keyBy(data.tokens, 'id');
            const missingPrices = mapValues(mappedPricingData, token =>
              multiply(nativePriceOfEth, token.derivedETH)
            );
            const missingPriceInfo = mapValues(
              missingPrices,
              (currentPrice, key) => {
                const historicalPrice = get(
                  missingHistoricalPrices,
                  `[${key}]`
                );
                const tokenAddress = get(mappedPricingData, `[${key}].id`);
                const relativePriceChange = historicalPrice
                  ? ((currentPrice - historicalPrice) / currentPrice) * 100
                  : 0;
                return {
                  price: currentPrice,
                  relativePriceChange,
                  tokenAddress,
                };
              }
            );
            const tokenPricingInfo = mapKeys(missingPriceInfo, 'tokenAddress');

            saveAssetPricesFromUniswap(
              tokenPricingInfo,
              accountAddress,
              network
            );
            dispatch({
              payload: tokenPricingInfo,
              type: DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP,
            });
          }
        } catch (error) {
          logger.log(
            'Error fetching historical prices from the subgraph',
            error
          );
        }
      },
    });
    dispatch({
      payload: {
        uniswapPricesQuery: newQuery,
        uniswapPricesSubscription: newSubscription,
      },
      type: DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION,
    });
  }
};

const get24HourPrice = async (address: any, yesterday: any) => {
  try {
    const result = await uniswapClient.query({
      fetchPolicy: 'no-cache',
      query: UNISWAP_24HOUR_PRICE_QUERY(address, yesterday),
    });
    return result?.data?.tokens?.[0];
  } catch (error) {
    logger.log('Error getting missing 24hour price', error);
    return null;
  }
};

export const assetPricesReceived = (message: any, fromFallback = false) => (
  dispatch: any,
  getState: any
) => {
  if (!fromFallback) {
    disableGenericAssetsFallbackIfNeeded();
  }
  const assets = message?.payload?.prices ?? {};
  const { nativeCurrency } = getState().settings;

  if (toLower(nativeCurrency) === message?.meta?.currency) {
    if (isEmpty(assets)) return;
    const parsedAssets = mapValues(assets, asset => parseAsset(asset));
    const { genericAssets } = getState().data;

    const updatedAssets = {
      ...genericAssets,
      ...parsedAssets,
    };

    dispatch({
      payload: updatedAssets,
      type: DATA_UPDATE_GENERIC_ASSETS,
    });
  }
  if (message?.meta?.currency === 'usd' && assets[ETH_ADDRESS]) {
    const value = assets[ETH_ADDRESS]?.price?.value;
    dispatch({
      payload: value,
      type: DATA_UPDATE_ETH_USD,
    });
  }
};

export const assetPricesChanged = (message: any) => (
  dispatch: any,
  getState: any
) => {
  const price = message?.payload?.prices?.[0]?.price;
  const assetAddress = message?.meta?.asset_code;
  if (isNil(price) || isNil(assetAddress)) return;
  const { genericAssets } = getState().data;
  const genericAsset = {
    ...get(genericAssets, assetAddress),
    price,
  };
  const updatedAssets = {
    ...genericAssets,
    [assetAddress]: genericAsset,
  };
  dispatch({
    payload: updatedAssets,
    type: DATA_UPDATE_GENERIC_ASSETS,
  });
};

export const dataAddNewTransaction = (
  txDetails: any,
  accountAddressToUpdate = null,
  disableTxnWatcher = false,
  provider = null
) => async (dispatch: any, getState: any) =>
  withRunExclusive(async () => {
    const { transactions } = getState().data;
    const { accountAddress, nativeCurrency, network } = getState().settings;
    if (
      accountAddressToUpdate &&
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'null' is not assignable to param... Remove this comment to see the full error message
      toLower(accountAddressToUpdate) !== toLower(accountAddress)
    )
      return;
    try {
      const parsedTransaction = await parseNewTransaction(
        txDetails,
        nativeCurrency
      );
      const _transactions = [parsedTransaction, ...transactions];
      dispatch({
        payload: _transactions,
        type: DATA_ADD_NEW_TRANSACTION_SUCCESS,
      });
      saveLocalTransactions(_transactions, accountAddress, network);
      await dispatch(
        incrementNonce(
          parsedTransaction.from,
          parsedTransaction.nonce,
          parsedTransaction.network
        )
      );
      if (
        !disableTxnWatcher ||
        network !== networkTypes.mainnet ||
        parsedTransaction?.network
      ) {
        dispatch(
          watchPendingTransactions(
            accountAddress,
            parsedTransaction.network
              ? TXN_WATCHER_MAX_TRIES_LAYER_2
              : TXN_WATCHER_MAX_TRIES,
            null,
            // @ts-expect-error ts-migrate(2554) FIXME: Expected 1-3 arguments, but got 4.
            provider
          )
        );
      }
      return parsedTransaction;
      // eslint-disable-next-line no-empty
    } catch (error) {}
  });

const getConfirmedState = (type: any) => {
  switch (type) {
    case TransactionTypes.authorize:
      return TransactionStatusTypes.approved;
    case TransactionTypes.deposit:
      return TransactionStatusTypes.deposited;
    case TransactionTypes.withdraw:
      return TransactionStatusTypes.withdrew;
    case TransactionTypes.receive:
      return TransactionStatusTypes.received;
    case TransactionTypes.purchase:
      return TransactionStatusTypes.purchased;
    default:
      return TransactionStatusTypes.sent;
  }
};

export const dataWatchPendingTransactions = (
  provider = null,
  currentNonce = -1
) => async (dispatch: any, getState: any) =>
  withRunExclusive(async () => {
    const { transactions } = getState().data;
    if (!transactions.length) return true;

    const [pending, remainingTransactions] = partition(
      transactions,
      txn => txn.pending
    );

    if (isEmpty(pending)) {
      return true;
    }
    let txStatusesDidChange = false;
    const updatedPendingTransactions = await Promise.all(
      pending.map(async tx => {
        const updatedPending = { ...tx };
        const txHash = ethereumUtils.getHash(tx);
        try {
          logger.log('Checking pending tx with hash', txHash);
          const p =
            provider || (await getProviderForNetwork(updatedPending.network));
          const txObj = await p.getTransaction(txHash);
          // if the nonce of last confirmed tx is higher than this pending tx then it got dropped
          const nonceAlreadyIncluded = currentNonce > tx.nonce;
          if (
            (txObj && txObj.blockNumber && txObj.blockHash) ||
            nonceAlreadyIncluded
          ) {
            // When speeding up a non "normal tx" we need to resubscribe
            // because zerion "append" event isn't reliable
            logger.log('TX CONFIRMED!', txObj);
            if (!nonceAlreadyIncluded) {
              appEvents.emit('transactionConfirmed', txObj);
            }
            const minedAt = Math.floor(Date.now() / 1000);
            txStatusesDidChange = true;
            if (txObj && !isZero(txObj.status)) {
              const isSelf = toLower(tx?.from) === toLower(tx?.to);
              const newStatus = getTransactionLabel({
                direction: isSelf
                  ? TransactionDirections.self
                  : TransactionDirections.out,
                pending: false,
                protocol: tx?.protocol,
                status:
                  tx.status === TransactionStatusTypes.cancelling
                    ? TransactionStatusTypes.cancelled
                    : getConfirmedState(tx.type),
                type: tx?.type,
              });
              updatedPending.status = newStatus;
            } else if (nonceAlreadyIncluded) {
              updatedPending.status = TransactionStatusTypes.unknown;
            } else {
              updatedPending.status = TransactionStatusTypes.failed;
            }
            const title = getTitle({
              protocol: tx.protocol,
              status: updatedPending.status,
              type: tx.type,
            });
            updatedPending.title = title;
            updatedPending.pending = false;
            updatedPending.minedAt = minedAt;
          }
        } catch (error) {
          logger.log('Error watching pending txn', error);
        }
        return updatedPending;
      })
    );

    if (txStatusesDidChange) {
      const filteredPendingTransactions = updatedPendingTransactions?.filter(
        ({ status }) => status !== TransactionStatusTypes.unknown
      );
      const updatedTransactions = concat(
        filteredPendingTransactions,
        remainingTransactions
      );
      dispatch(updatePurchases(updatedTransactions));
      const { accountAddress, network } = getState().settings;
      dispatch({
        payload: updatedTransactions,
        type: DATA_UPDATE_TRANSACTIONS,
      });
      saveLocalTransactions(updatedTransactions, accountAddress, network);

      const pendingTx = updatedTransactions.find(tx => tx.pending);
      if (!pendingTx) {
        return true;
      }
    }
    return false;
  });

export const dataUpdateTransaction = (
  txHash: any,
  txObj: any,
  watch: any,
  provider = null
) => async (dispatch: any, getState: any) =>
  withRunExclusive(async () => {
    const { transactions } = getState().data;

    const allOtherTx = transactions.filter((tx: any) => tx.hash !== txHash);
    const updatedTransactions = [txObj].concat(allOtherTx);

    dispatch({
      payload: updatedTransactions,
      type: DATA_UPDATE_TRANSACTIONS,
    });
    const { accountAddress, network } = getState().settings;
    saveLocalTransactions(updatedTransactions, accountAddress, network);
    // Always watch cancellation and speed up
    if (watch) {
      dispatch(
        watchPendingTransactions(
          accountAddress,
          txObj.network ? TXN_WATCHER_MAX_TRIES_LAYER_2 : TXN_WATCHER_MAX_TRIES,
          provider
        )
      );
    }
  });

const updatePurchases = (updatedTransactions: any) => (dispatch: any) => {
  const confirmedPurchases = filter(updatedTransactions, txn => {
    return (
      txn.type === TransactionTypes.purchase &&
      txn.status !== TransactionStatusTypes.purchasing
    );
  });
  dispatch(addCashUpdatePurchases(confirmedPurchases));
};

export const checkPendingTransactionsOnInitialize = (
  accountAddressToWatch: any,
  provider = null
) => async (dispatch: any, getState: any) => {
  const { accountAddress: currentAccountAddress } = getState().settings;
  if (currentAccountAddress !== accountAddressToWatch) return;
  const currentNonce = await (provider || web3Provider).getTransactionCount(
    currentAccountAddress,
    'latest'
  );
  await dispatch(dataWatchPendingTransactions(provider, currentNonce));
};

export const watchPendingTransactions = (
  accountAddressToWatch: any,
  remainingTries = TXN_WATCHER_MAX_TRIES,
  provider = null
) => async (dispatch: any, getState: any) => {
  pendingTransactionsHandle && clearTimeout(pendingTransactionsHandle);
  if (remainingTries === 0) return;

  const { accountAddress: currentAccountAddress } = getState().settings;
  if (currentAccountAddress !== accountAddressToWatch) return;

  const done = await dispatch(dataWatchPendingTransactions(provider));

  if (!done) {
    pendingTransactionsHandle = setTimeout(() => {
      dispatch(
        watchPendingTransactions(
          accountAddressToWatch,
          remainingTries - 1,
          provider
        )
      );
    }, TXN_WATCHER_POLL_INTERVAL);
  }
};

export const addNewSubscriber = (subscriber: any, type: any) => (
  dispatch: any,
  getState: any
) => {
  const { subscribers } = getState().data;
  const newSubscribers = { ...subscribers };
  newSubscribers[type] = concat(newSubscribers[type], subscriber);

  dispatch({
    payload: newSubscribers,
    type: DATA_ADD_NEW_SUBSCRIBER,
  });
};

export const updateRefetchSavings = (fetch: any) => (dispatch: any) =>
  dispatch({
    payload: fetch,
    type: DATA_UPDATE_REFETCH_SAVINGS,
  });

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  assetPricesFromUniswap: {},
  assets: [], // for account-specific assets
  ethUSDCharts: null,
  ethUSDPrice: null,
  genericAssets: {},
  isLoadingAssets: true,
  isLoadingTransactions: true,
  portfolios: {},
  shouldRefetchSavings: false,
  subscribers: {
    appended: [],
    received: [],
  },
  transactions: [],
  uniswapPricesQuery: null,
  uniswapPricesSubscription: null,
};

export default (state = INITIAL_STATE, action: any) => {
  switch (action.type) {
    case DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION:
      return {
        ...state,
        uniswapPricesQuery: action.payload.uniswapPricesQuery,
        uniswapPricesSubscription: action.payload.uniswapPricesSubscription,
      };
    case DATA_UPDATE_REFETCH_SAVINGS:
      return { ...state, shouldRefetchSavings: action.payload };
    case DATA_UPDATE_ASSET_PRICES_FROM_UNISWAP:
      return { ...state, assetPricesFromUniswap: action.payload };
    case DATA_UPDATE_GENERIC_ASSETS:
      return { ...state, genericAssets: action.payload };
    case DATA_UPDATE_ASSETS:
      return { ...state, assets: action.payload, isLoadingAssets: false };
    case DATA_UPDATE_TRANSACTIONS:
      return {
        ...state,
        isLoadingTransactions: false,
        transactions: action.payload,
      };
    case DATA_UPDATE_PORTFOLIOS:
      return {
        ...state,
        portfolios: action.payload,
      };
    case DATA_UPDATE_ETH_USD:
      return {
        ...state,
        ethUSDPrice: action.payload,
      };
    case DATA_UPDATE_ETH_USD_CHARTS:
      return {
        ...state,
        ethUSDCharts: action.payload,
      };
    case DATA_LOAD_TRANSACTIONS_REQUEST:
      return {
        ...state,
        isLoadingTransactions: true,
      };
    case DATA_LOAD_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        isLoadingTransactions: false,
        transactions: action.payload,
      };
    case DATA_LOAD_TRANSACTIONS_FAILURE:
      return {
        ...state,
        isLoadingTransactions: false,
      };
    case DATA_LOAD_ASSETS_REQUEST:
      return {
        ...state,
        isLoadingAssets: true,
      };
    case DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS:
      return {
        ...state,
        assetPricesFromUniswap: action.payload,
      };
    case DATA_LOAD_ASSETS_SUCCESS:
      return {
        ...state,
        assets: action.payload,
        isLoadingAssets: false,
      };
    case DATA_LOAD_ASSETS_FAILURE:
      return {
        ...state,
        isLoadingAssets: false,
      };
    case DATA_ADD_NEW_TRANSACTION_SUCCESS:
      return {
        ...state,
        transactions: action.payload,
      };
    case DATA_ADD_NEW_SUBSCRIBER:
      return {
        ...state,
        subscribers: action.payload,
      };
    case DATA_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
        genericAssets: state.genericAssets,
      };
    default:
      return state;
  }
};
