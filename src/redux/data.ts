import { ObservableQuery } from '@apollo/client';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { getUnixTime, startOfMinute, sub } from 'date-fns';
import isValidDomain from 'is-valid-domain';
import {
  filter,
  find,
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
  pickBy,
  property,
  toLower,
  toUpper,
  uniqBy,
} from 'lodash';
import debounce from 'lodash/debounce';
import { MMKV } from 'react-native-mmkv';
import { AnyAction, Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { uniswapClient } from '../apollo/client';
import {
  UNISWAP_24HOUR_PRICE_QUERY,
  UNISWAP_PRICES_QUERY,
} from '../apollo/queries';
import { BooleanMap } from '../hooks/useCoinListEditOptions';
import { addCashUpdatePurchases } from './addCash';
import { decrementNonce, incrementNonce } from './nonceManager';
import { AppGetState, AppState } from './store';
import { uniqueTokensRefreshState } from './uniqueTokens';
import { uniswapUpdateLiquidityTokens } from './uniswapLiquidity';
import {
  AssetTypes,
  NativeCurrencyKeys,
  NewTransactionOrAddCashTransaction,
  ParsedAddressAsset,
  RainbowTransaction,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  TransactionTypes,
  ZerionAsset,
  ZerionAssetFallback,
  ZerionTransaction,
} from '@rainbow-me/entities';
import appEvents from '@rainbow-me/handlers/appEvents';
import {
  getAccountAssetsData,
  getAssetPricesFromUniswap,
  getLocalPendingTransactions,
  getLocalTransactions,
  saveAccountAssetsData,
  saveAccountEmptyState,
  saveAssetPricesFromUniswap,
  saveLocalPendingTransactions,
  saveLocalTransactions,
} from '@rainbow-me/handlers/localstorage/accountLocal';
import {
  getProviderForNetwork,
  isL2Network,
  web3Provider,
} from '@rainbow-me/handlers/web3';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { Navigation } from '@rainbow-me/navigation';
import { triggerOnSwipeLayout } from '@rainbow-me/navigation/onNavigationStateChange';
import { Network } from '@rainbow-me/networkTypes';
import {
  getTitle,
  getTransactionLabel,
  parseAccountAssets,
  parseAsset,
  parseNewTransaction,
  parseTransactions,
} from '@rainbow-me/parsers';
import { setHiddenCoins } from '@rainbow-me/redux/editOptions';
import {
  coingeckoIdsFallback,
  DPI_ADDRESS,
  ETH_ADDRESS,
  ETH_COINGECKO_ID,
  shitcoins,
} from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { delay, isZero, multiply } from '@rainbow-me/utilities';
import {
  ethereumUtils,
  getBlocksFromTimestamps,
  isLowerCaseMatch,
  TokensListenedCache,
} from '@rainbow-me/utils';
import logger from 'logger';

const storage = new MMKV();

/**
 * Adds new hidden coins for an address and updates key-value storage.
 *
 * @param coins New coin IDs.
 * @param dispatch The Redux dispatch.
 * @param address The address to hide coins for.
 */
function addHiddenCoins(
  coins: string[],
  dispatch: ThunkDispatch<AppState, unknown, never>,
  address: string
) {
  const storageKey = 'hidden-coins-obj-' + address;
  const storageEntity = storage.getString(storageKey);
  const list = Object.keys(storageEntity ? JSON.parse(storageEntity) : {});
  const newHiddenCoins = [
    ...list.filter((i: string) => !coins.includes(i)),
    ...coins,
  ].reduce((acc, curr) => {
    acc[curr] = true;
    return acc;
  }, {} as BooleanMap);
  dispatch(setHiddenCoins(newHiddenCoins));
  storage.set(storageKey, JSON.stringify(newHiddenCoins));
}

const BACKUP_SHEET_DELAY_MS = android ? 10000 : 3000;

let pendingTransactionsHandle: ReturnType<typeof setTimeout> | null = null;
let genericAssetsHandle: ReturnType<typeof setTimeout> | null = null;
const TXN_WATCHER_MAX_TRIES = 60;
const TXN_WATCHER_MAX_TRIES_LAYER_2 = 200;
const TXN_WATCHER_POLL_INTERVAL = 5000; // 5 seconds
const GENERIC_ASSETS_REFRESH_INTERVAL = 60000; // 1 minute
const GENERIC_ASSETS_FALLBACK_TIMEOUT = 10000; // 10 seconds

export const COINGECKO_IDS_ENDPOINT =
  'https://api.coingecko.com/api/v3/coins/list?include_platform=true&asset_platform_id=ethereum';

// -- Constants --------------------------------------- //

const DATA_UPDATE_GENERIC_ASSETS = 'data/DATA_UPDATE_GENERIC_ASSETS';
const DATA_UPDATE_ETH_USD = 'data/DATA_UPDATE_ETH_USD';
const DATA_UPDATE_PORTFOLIOS = 'data/DATA_UPDATE_PORTFOLIOS';
const DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION =
  'data/DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION';

const DATA_LOAD_ACCOUNT_ASSETS_DATA_REQUEST =
  'data/DATA_LOAD_ACCOUNT_ASSETS_DATA_REQUEST';
const DATA_LOAD_ACCOUNT_ASSETS_DATA_RECEIVED =
  'data/DATA_LOAD_ACCOUNT_ASSETS_DATA_RECEIVED';
const DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS =
  'data/DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS';
const DATA_LOAD_ACCOUNT_ASSETS_DATA_FAILURE =
  'data/DATA_LOAD_ACCOUNT_ASSETS_DATA_FAILURE';
const DATA_LOAD_ACCOUNT_ASSETS_DATA_FINALIZED =
  'data/DATA_LOAD_ACCOUNT_ASSETS_DATA_FINALIZED';

const DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS =
  'data/DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS';

const DATA_LOAD_TRANSACTIONS_REQUEST = 'data/DATA_LOAD_TRANSACTIONS_REQUEST';
const DATA_LOAD_TRANSACTIONS_SUCCESS = 'data/DATA_LOAD_TRANSACTIONS_SUCCESS';
const DATA_LOAD_TRANSACTIONS_FAILURE = 'data/DATA_LOAD_TRANSACTIONS_FAILURE';

const DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS =
  'data/DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS';

const DATA_UPDATE_REFETCH_SAVINGS = 'data/DATA_UPDATE_REFETCH_SAVINGS';

const DATA_CLEAR_STATE = 'data/DATA_CLEAR_STATE';

// -- Actions ---------------------------------------- //

/**
 * The state for the `data` reducer.
 */
interface DataState {
  /**
   * Parsed asset information for assets belonging to this account.
   */
  accountAssetsData: {
    [uniqueId: string]: ParsedAddressAsset;
  };

  /**
   * Uniswap price data for assets.
   */
  assetPricesFromUniswap: {
    [assetAddress: string]: UniswapAssetPriceData;
  };

  /**
   * The ETH price in USD.
   */
  ethUSDPrice: number | undefined | null;

  /**
   * Parsed asset information for generic loaded assets.
   */
  genericAssets: {
    [assetAddress: string]: ParsedAddressAsset;
  };

  /**
   * Whether or not assets are currently being loaded.
   */
  isLoadingAssets: boolean;

  /**
   * Whether or not transactions are currently being loaded.
   */
  isLoadingTransactions: boolean;

  /**
   * Pending transactions for this account.
   */
  pendingTransactions: RainbowTransaction[];

  /**
   * Zerion portfolio information keyed by account address.
   */
  portfolios: {
    [accountAddress: string]: ZerionPortfolio;
  };

  /**
   * Whether or not savings should be reset.
   */
  shouldRefetchSavings: boolean;

  /**
   * Transactions for this account.
   */
  transactions: RainbowTransaction[];

  /**
   * A GraphQL query for Uniswap data.
   */
  uniswapPricesQuery: ObservableQuery<
    UniswapPricesQueryData,
    UniswapPricesQueryVariables
  > | null;

  /**
   * An active subscription for data from `uniswapPricesQuery`.
   */
  uniswapPricesSubscription: ZenObservable.Subscription | null;
}

/**
 * An action for the `data` reducer.
 */
type DataAction =
  | DataUpdateUniswapPricesSubscriptionAction
  | DataUpdateRefetchSavingsAction
  | DataUpdateGenericAssetsAction
  | DataUpdatePortfoliosAction
  | DataUpdateEthUsdAction
  | DataLoadTransactionsRequestAction
  | DataLoadTransactionSuccessAction
  | DataLoadTransactionsFailureAction
  | DataLoadAccountAssetsDataRequestAction
  | DataLoadAssetPricesFromUniswapSuccessAction
  | DataLoadAccountAssetsDataReceivedAction
  | DataLoadAccountAssetsDataSuccessAction
  | DataLoadAccountAssetsDataFailureAction
  | DataLoadAccountAssetsDataFinalizedAction
  | DataUpdatePendingTransactionSuccessAction
  | DataClearStateAction;

/**
 * The action to update the Uniswap prices query and subscription.
 */
interface DataUpdateUniswapPricesSubscriptionAction {
  type: typeof DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION;
  payload: {
    uniswapPricesQuery: DataState['uniswapPricesQuery'];
    uniswapPricesSubscription: DataState['uniswapPricesSubscription'];
  };
}

/**
 * The action to change `shouldRefetchSavings`.
 */
interface DataUpdateRefetchSavingsAction {
  type: typeof DATA_UPDATE_REFETCH_SAVINGS;
  payload: boolean;
}

/**
 * The action to update `genericAssets`.
 */
interface DataUpdateGenericAssetsAction {
  type: typeof DATA_UPDATE_GENERIC_ASSETS;
  payload: DataState['genericAssets'];
}

/**
 * The action to update `portfolios`.
 */
interface DataUpdatePortfoliosAction {
  type: typeof DATA_UPDATE_PORTFOLIOS;
  payload: DataState['portfolios'];
}

/**
 * The action to update `ethUSDPrice`.
 */
interface DataUpdateEthUsdAction {
  type: typeof DATA_UPDATE_ETH_USD;
  payload: number | undefined;
}

/**
 * The action to set `isLoadingTransactions` to `true`.
 */
interface DataLoadTransactionsRequestAction {
  type: typeof DATA_LOAD_TRANSACTIONS_REQUEST;
}

/**
 * The action used to update transactions and indicate that loading transactions
 * was successful.
 */
interface DataLoadTransactionSuccessAction {
  type: typeof DATA_LOAD_TRANSACTIONS_SUCCESS;
  payload: DataState['transactions'];
}

/**
 * The action used to indicate that loading a transaction failed.
 */
interface DataLoadTransactionsFailureAction {
  type: typeof DATA_LOAD_TRANSACTIONS_FAILURE;
}

/**
 * The action to set `isLoadingAssets` to `true`.
 */
interface DataLoadAccountAssetsDataRequestAction {
  type: typeof DATA_LOAD_ACCOUNT_ASSETS_DATA_REQUEST;
}

/**
 * The action to update `accountAssetsData` and indicate that data has been
 * received.
 */
interface DataLoadAccountAssetsDataReceivedAction {
  type: typeof DATA_LOAD_ACCOUNT_ASSETS_DATA_RECEIVED;
  payload: DataState['accountAssetsData'];
}

/**
 * The action to update `assetPricesFromUniswap` and indicate data has been
 * fetched successfully.
 */
interface DataLoadAssetPricesFromUniswapSuccessAction {
  type: typeof DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS;
  payload: DataState['assetPricesFromUniswap'];
}

/**
 * The action to update `accountAssetsData` and indicate that loading was
 * successful.
 */
interface DataLoadAccountAssetsDataSuccessAction {
  type: typeof DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS;
  payload: DataState['accountAssetsData'];
}

/**
 * The action used to incidate that loading account asset data failed.
 */
interface DataLoadAccountAssetsDataFailureAction {
  type: typeof DATA_LOAD_ACCOUNT_ASSETS_DATA_FAILURE;
}

/**
 * The action used to incidate that loading *all* account assets is finished.
 */
interface DataLoadAccountAssetsDataFinalizedAction {
  type: typeof DATA_LOAD_ACCOUNT_ASSETS_DATA_FINALIZED;
}

/**
 * The action used to indicate that transactions were added successfully,
 * with a payload including the entire new array for `transactions`.
 */
interface DataUpdatePendingTransactionSuccessAction {
  type: typeof DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS;
  payload: DataState['transactions'];
}

/**
 * The action used to clear the state while maintaining generic asset data.
 */
interface DataClearStateAction {
  type: typeof DATA_CLEAR_STATE;
}

// Uniswap types:

/**
 * Price data loaded from a Uniswap query.
 */
interface UniswapPricesQueryData {
  tokens: {
    id: string;
    derivedETH: string;
    symbol: string;
    name: string;
    decimals: string;
  }[];
}

/**
 * Variables included in the Uniswap price query.
 */
interface UniswapPricesQueryVariables {
  addresses: string[];
}

/**
 * Data stored following a successful Uniswap query.
 */
interface UniswapAssetPriceData {
  price: string;
  relativePriceChange: number;
  tokenAddress: string;
}

// Coingecko types:

/**
 * Data loaded from the Coingecko API when the `last_updated_at` field is
 * requested. Keys of the format `[currency_id]` and `[currency_id]_24h_change`
 * are also included.
 */
interface CoingeckoApiResponseWithLastUpdate {
  [coingeckoId: string]: {
    [currencyIdOr24hChange: string]: number;
    last_updated_at: number;
  };
}

// Zerion types:

/**
 * Data loaded from the Zerion API for a portfolio. See
 * https://docs.zerion.io/websockets/models#portfolio for details.
 */
interface ZerionPortfolio {
  assets_value: number;
  deposited_value: number;
  borrowed_value: number;
  locked_value: number;
  staked_value: number;
  bsc_assets_value: number;
  polygon_assets_value: number;
  total_value: number;
  absolute_change_24h: number;
  relative_change_24h?: number;
}

/**
 * A message from the Zerion API indicating that assets were received.
 */
interface AddressAssetsReceivedMessage {
  payload?: {
    assets?: {
      [id: string]: {
        asset: ZerionAsset;
      };
    };
  };
  meta?: MessageMeta;
}

/**
 * A message from the Zerion API indicating that portfolio data was received.
 */
interface PortfolioReceivedMessage {
  payload?: {
    portfolio?: ZerionPortfolio;
  };
  meta?: MessageMeta;
}

/**
 * A message from the Zerion API indicating that transaction data was received.
 */
interface TransactionsReceivedMessage {
  payload?: {
    transactions?: ZerionTransaction[];
  };
  meta?: MessageMeta;
}

/**
 * A message from the Zerion API indicating that transactions were removed.
 */
interface TransactionsRemovedMessage {
  payload?: {
    transactions?: ZerionTransaction[];
  };
  meta?: MessageMeta;
}

/**
 * A message from the Zerion API indicating that asset data was received. Note,
 * an actual message directly from Zerion would only include `ZerionAsset`
 * as the value type in the `prices` map, but this message type is also used
 * when manually invoking `assetPricesReceived` with fallback values.
 */
interface AssetPricesReceivedMessage {
  payload?: {
    prices?: {
      [id: string]: ZerionAsset | ZerionAssetFallback;
    };
  };
  meta?: MessageMeta;
}

/**
 * A message from the Zerion API indicating that asset prices were changed.
 */
interface AssetPricesChangedMessage {
  payload?: {
    prices?: ZerionAsset[];
  };
  meta?: MessageMeta & { asset_code?: string };
}

/**
 * Metadata for a message from the Zerion API.
 */
interface MessageMeta {
  address?: string;
  currency?: string;
  status?: string;
  chain_id?: Network; // L2
}

/**
 * A message from the Zerion API.
 */
type DataMessage =
  | AddressAssetsReceivedMessage
  | PortfolioReceivedMessage
  | TransactionsReceivedMessage
  | TransactionsRemovedMessage
  | AssetPricesReceivedMessage
  | AssetPricesChangedMessage;

// Functions:

/**
 * Loads initial state from account local storage.
 */
export const dataLoadState = () => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    | DataLoadAssetPricesFromUniswapSuccessAction
    | DataLoadAccountAssetsDataRequestAction
    | DataLoadAccountAssetsDataSuccessAction
    | DataLoadAccountAssetsDataFailureAction
    | DataLoadTransactionSuccessAction
    | DataLoadTransactionsRequestAction
    | DataLoadTransactionsFailureAction
    | DataUpdatePendingTransactionSuccessAction
  >,
  getState: AppGetState
) => {
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
    dispatch({ type: DATA_LOAD_ACCOUNT_ASSETS_DATA_REQUEST });
    const accountAssetsData = await getAccountAssetsData(
      accountAddress,
      network
    );

    if (!isEmpty(accountAssetsData)) {
      dispatch({
        payload: accountAssetsData,
        type: DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS,
      });
    }
  } catch (error) {
    dispatch({ type: DATA_LOAD_ACCOUNT_ASSETS_DATA_FAILURE });
  }
  try {
    dispatch({ type: DATA_LOAD_TRANSACTIONS_REQUEST });
    const transactions = await getLocalTransactions(accountAddress, network);
    const pendingTransactions = await getLocalPendingTransactions(
      accountAddress,
      network
    );
    dispatch({
      payload: pendingTransactions,
      type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
    });
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
};

/**
 * Fetches asset prices from the Coingecko API.
 *
 * @param coingeckoIds The Coingecko IDs to fetch asset prices for.
 * @param nativeCurrency The native currency use for reporting asset prices.
 * @returns The Coingecko API response, or undefined if the fetch is
 * unsuccessful.
 */
export const fetchAssetPricesWithCoingecko = async (
  coingeckoIds: string[],
  nativeCurrency: string
): Promise<CoingeckoApiResponseWithLastUpdate | undefined> => {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds
      .filter(val => !!val)
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

/**
 * Loads generic asset prices from fallback data and updates state, in the
 * event that Zerion is unavailable.
 */
const genericAssetsFallback = () => async (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
  logger.log('ZERION IS DOWN! ENABLING GENERIC ASSETS FALLBACK');
  const { nativeCurrency } = getState().settings;
  const formattedNativeCurrency = toLower(nativeCurrency);
  let ids: typeof coingeckoIdsFallback;
  try {
    const request = await fetch(COINGECKO_IDS_ENDPOINT);
    ids = await request.json();
  } catch (e) {
    ids = coingeckoIdsFallback;
  }

  const allAssets: ZerionAssetFallback[] = [
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
      ({ platforms: { ethereum: tokenAddress } }) =>
        toLower(tokenAddress) === address
    );

    if (coingeckoAsset) {
      allAssets.push({
        asset_code: address,
        coingecko_id: coingeckoAsset?.id,
        name: coingeckoAsset.name,
        symbol: toUpper(coingeckoAsset.symbol),
      });
    }
  });

  const allAssetsUnique = uniqBy(allAssets, token => token.asset_code);

  let prices: CoingeckoApiResponseWithLastUpdate = {};
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
      for (let uniqueAsset of allAssetsUnique) {
        if (toLower(uniqueAsset.coingecko_id) === toLower(key)) {
          uniqueAsset.price = {
            changed_at: prices[key].last_updated_at,
            relative_change_24h:
              prices[key][`${formattedNativeCurrency}_24h_change`],
            value: prices[key][`${formattedNativeCurrency}`],
          };
          break;
        }
      }
    });
  }

  const allPrices: {
    [id: string]: ZerionAssetFallback;
  } = {};

  allAssetsUnique.forEach(asset => {
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

/**
 * Disables the generic asset fallback timeout if one is set.
 */
export const disableGenericAssetsFallbackIfNeeded = () => {
  if (genericAssetsHandle) {
    clearTimeout(genericAssetsHandle);
  }
};

/**
 * Resets state, with the exception of generic asset prices, and unsubscribes
 * from listeners and timeouts.
 */
export const dataResetState = () => (
  dispatch: Dispatch<DataClearStateAction>,
  getState: AppGetState
) => {
  const { uniswapPricesSubscription } = getState().data;
  uniswapPricesSubscription?.unsubscribe?.();
  pendingTransactionsHandle && clearTimeout(pendingTransactionsHandle);
  genericAssetsHandle && clearTimeout(genericAssetsHandle);
  dispatch({ type: DATA_CLEAR_STATE });
};

/**
 * Updates account asset data in state for a specific asset and saves to account
 * local storage.
 *
 * @param assetData The updated asset, which replaces or adds to the current
 * account's asset data based on it's `uniqueId`.
 */
export const dataUpdateAsset = (assetData: ParsedAddressAsset) => (
  dispatch: Dispatch<DataLoadAccountAssetsDataSuccessAction>,
  getState: AppGetState
) => {
  const { accountAddress, network } = getState().settings;
  const { accountAssetsData } = getState().data;
  const updatedAssetsData = {
    ...accountAssetsData,
    [assetData.uniqueId]: assetData,
  };
  dispatch({
    payload: updatedAssetsData,
    type: DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS,
  });
  saveAccountAssetsData(updatedAssetsData, accountAddress, network);
};

/**
 * Replaces the account asset data in state and saves to account local storage.
 *
 * @param assetsData The new asset data.
 */
export const dataUpdateAssets = (assetsData: {
  [uniqueId: string]: ParsedAddressAsset;
}) => (
  dispatch: Dispatch<DataLoadAccountAssetsDataSuccessAction>,
  getState: AppGetState
) => {
  const { accountAddress, network } = getState().settings;
  if (!isEmpty(assetsData)) {
    saveAccountAssetsData(assetsData, accountAddress, network);
    // Change the state since the account isn't empty anymore
    saveAccountEmptyState(false, accountAddress, network);
    dispatch({
      payload: assetsData,
      type: DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS,
    });
  }
};

/**
 * Checks whether or not metadata received from Zerion is valid.
 *
 * @param message The message received from Zerion.
 */
const checkMeta = (message: DataMessage | undefined) => (
  dispatch: Dispatch<never>,
  getState: AppGetState
) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const address = message?.meta?.address;
  const currency = message?.meta?.currency;
  return (
    isLowerCaseMatch(address!, accountAddress) &&
    isLowerCaseMatch(currency!, nativeCurrency)
  );
};

/**
 * Checks to see if new savings are available based on incoming transaction data,
 * and if so, updates state to request refetching savings.
 *
 * @param transactionsData Incoming transaction data.
 */
const checkForConfirmedSavingsActions = (
  transactionsData: ZerionTransaction[]
) => (dispatch: ThunkDispatch<AppState, unknown, never>) => {
  const foundConfirmedSavings = find(
    transactionsData,
    (transaction: ZerionTransaction) =>
      (transaction?.type === 'deposit' || transaction?.type === 'withdraw') &&
      transaction?.status === 'confirmed'
  );
  if (foundConfirmedSavings) {
    dispatch(updateRefetchSavings(true));
  }
};

/**
 * Checks to see if a network's nonce should be incremented for an acount
 * based on incoming transaction data, and if so, updates state.
 *
 * @param transactionData Incoming transaction data.
 */
const checkForUpdatedNonce = (transactionData: ZerionTransaction[]) => (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
  if (transactionData.length) {
    const { accountAddress, network } = getState().settings;
    const txSortedByDescendingNonce = transactionData
      .filter(
        ({ address_from }) =>
          address_from?.toLowerCase() === accountAddress.toLowerCase()
      )
      .sort(({ nonce: n1 }, { nonce: n2 }) => (n2 ?? 0) - (n1 ?? 0));
    const [latestTx] = txSortedByDescendingNonce;
    const { address_from, nonce } = latestTx;
    if (nonce) {
      dispatch(incrementNonce(address_from!, nonce, network));
    }
  }
};

/**
 * Checks to see if a network's nonce should be decremented for an account
 * based on incoming transaction data, and if so, updates state.
 *
 * @param removedTransactions Removed transaction data.
 */
const checkForRemovedNonce = (removedTransactions: RainbowTransaction[]) => (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
  if (removedTransactions.length) {
    const { accountAddress, network } = getState().settings;
    const txSortedByAscendingNonce = removedTransactions
      .filter(({ from }) => from === accountAddress)
      .sort(({ nonce: n1 }, { nonce: n2 }) => (n1 ?? 0) - (n2 ?? 0));
    const [lowestNonceTx] = txSortedByAscendingNonce;
    const { nonce } = lowestNonceTx;
    dispatch(decrementNonce(accountAddress, nonce!, network));
  }
};

/**
 * Handles an incoming portfolio data message from Zerion and updates state
 * accordidngly.
 *
 * @param message The `PortfolioReceivedMessage`, or undefined.
 */
export const portfolioReceived = (
  message: PortfolioReceivedMessage | undefined
) => async (
  dispatch: Dispatch<DataUpdatePortfoliosAction>,
  getState: AppGetState
) => {
  if (message?.meta?.status !== 'ok') return;
  if (!message?.payload?.portfolio) return;

  const { portfolios } = getState().data;

  const newPortfolios = { ...portfolios };
  newPortfolios[message.meta.address!] = message.payload.portfolio;

  dispatch({
    payload: newPortfolios,
    type: DATA_UPDATE_PORTFOLIOS,
  });
};

/**
 * Handles a `TransactionsReceivedMessage` message from Zerion and updates
 * state and account local storage accordingly.
 *
 * @param message The `TransactionsReceivedMessage`, or undefined.
 * @param appended Whether or not transactions are being appended.
 */
export const transactionsReceived = (
  message: TransactionsReceivedMessage | undefined,
  appended = false
) => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    DataLoadTransactionSuccessAction | DataUpdatePendingTransactionSuccessAction
  >,
  getState: AppGetState
) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;
  const transactionData = message?.payload?.transactions ?? [];
  if (appended) {
    dispatch(checkForConfirmedSavingsActions(transactionData));
  }
  if (transactionData.length) {
    dispatch(checkForUpdatedNonce(transactionData));
  }

  const { accountAddress, nativeCurrency } = getState().settings;
  const { purchaseTransactions } = getState().addCash;
  const { pendingTransactions, transactions } = getState().data;
  const { selected } = getState().wallets;

  let { network } = getState().settings;
  if (network === Network.mainnet && message?.meta?.chain_id) {
    network = message?.meta?.chain_id;
  }
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
  const txHashes = parsedTransactions.map(tx => ethereumUtils.getHash(tx));
  const updatedPendingTransactions = pendingTransactions.filter(
    tx => !txHashes.includes(ethereumUtils.getHash(tx))
  );
  dispatch({
    payload: updatedPendingTransactions,
    type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
  });
  dispatch({
    payload: parsedTransactions,
    type: DATA_LOAD_TRANSACTIONS_SUCCESS,
  });
  dispatch(updatePurchases(parsedTransactions));
  saveLocalTransactions(parsedTransactions, accountAddress, network);
  saveLocalPendingTransactions(
    updatedPendingTransactions,
    accountAddress,
    network
  );

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
};

/**
 * Handles a `TransactionsRemovedMessage` from Zerion and updates state and
 * account local storage.
 *
 * @param message The incoming `TransactionsRemovedMessage` or undefined.
 */
export const transactionsRemoved = (
  message: TransactionsRemovedMessage | undefined
) => async (
  dispatch: ThunkDispatch<AppState, unknown, DataLoadTransactionSuccessAction>,
  getState: AppGetState
) => {
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
    type: DATA_LOAD_TRANSACTIONS_SUCCESS,
  });

  dispatch(checkForRemovedNonce(removedTransactions));
  saveLocalTransactions(updatedTransactions, accountAddress, network);
};

/**
 * Handles an `AddressAssetsReceivedMessage` from Zerion and updates state and
 * account local storage.
 *
 * @param message The message.
 * @param append Whether or not the asset data is being appended.
 * @param change Whether or not an existing asset is being changed.
 * @param removed Whether or not an asset is being removed.
 * @param assetsNetwork The asset's network.
 */
export const addressAssetsReceived = (
  message: AddressAssetsReceivedMessage,
  append: boolean = false,
  change: boolean = false,
  removed: boolean = false,
  assetsNetwork: Network | null = null
) => (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    DataLoadAccountAssetsDataReceivedAction
  >,
  getState: AppGetState
) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;
  const { accountAddress, network } = getState().settings;
  const responseAddress = message?.meta?.address;
  const addressMatch =
    accountAddress?.toLowerCase() === responseAddress?.toLowerCase();
  if (!addressMatch) return;

  const { uniqueTokens } = getState().uniqueTokens;
  const newAssets = message?.payload?.assets ?? {};
  let updatedAssets = pickBy(
    newAssets,
    asset =>
      asset?.asset?.type !== AssetTypes.compound &&
      asset?.asset?.type !== AssetTypes.trash &&
      !shitcoins.includes(toLower(asset?.asset?.asset_code))
  );

  if (removed) {
    updatedAssets = mapValues(newAssets, asset => {
      return {
        ...asset,
        quantity: 0,
      };
    });
  }

  let parsedAssets = parseAccountAssets(updatedAssets, uniqueTokens) as {
    [id: string]: ParsedAddressAsset;
  };

  const liquidityTokens = filter(
    parsedAssets,
    asset => asset?.type === AssetTypes.uniswapV2
  );

  // remove V2 LP tokens
  parsedAssets = pickBy(
    parsedAssets,
    asset => asset?.type !== AssetTypes.uniswapV2
  );

  const isL2 = assetsNetwork && isL2Network(assetsNetwork);
  if (!isL2 && !assetsNetwork) {
    dispatch(
      uniswapUpdateLiquidityTokens(liquidityTokens, append || change || removed)
    );
  }

  const { accountAssetsData: existingAccountAssetsData } = getState().data;
  parsedAssets = {
    ...existingAccountAssetsData,
    ...parsedAssets,
  };

  parsedAssets = pickBy(
    parsedAssets,
    asset => !!Number(asset?.balance?.amount)
  );

  saveAccountAssetsData(parsedAssets, accountAddress, network);
  if (!isEmpty(parsedAssets)) {
    // Change the state since the account isn't empty anymore
    saveAccountEmptyState(false, accountAddress, network);
  }

  dispatch({
    payload: parsedAssets,
    type: DATA_LOAD_ACCOUNT_ASSETS_DATA_RECEIVED,
  });
  if (!change) {
    const missingPriceAssetAddresses: string[] = map(
      filter(parsedAssets, asset => isNil(asset?.price)),
      property('address')
    );
    dispatch(subscribeToMissingPrices(missingPriceAssetAddresses));
  }

  //Hide tokens with a url as their token name
  const assetsWithScamURL: string[] = map(
    filter(
      parsedAssets,
      asset => isValidDomain(asset.name) && !asset.isVerified
    ),
    property('uniqueId')
  );
  addHiddenCoins(assetsWithScamURL, dispatch, accountAddress);
};

/**
 * Subscribes to asset prices on Uniswap and updates state and local storage
 * when price data is loaded.
 *
 * @param addresses The asset addresses to subscribe to.
 */
const subscribeToMissingPrices = (addresses: string[]) => (
  dispatch: Dispatch<
    | DataLoadAssetPricesFromUniswapSuccessAction
    | DataUpdateUniswapPricesSubscriptionAction
  >,
  getState: AppGetState
) => {
  const { accountAddress, network } = getState().settings;
  const { uniswapPricesQuery } = getState().data;

  if (uniswapPricesQuery) {
    uniswapPricesQuery.refetch({ addresses });
  } else {
    const newQuery = uniswapClient.watchQuery<
      UniswapPricesQueryData,
      UniswapPricesQueryVariables
    >({
      fetchPolicy: 'no-cache',
      pollInterval: 30000, // 30 seconds
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
            const tokenAddresses: string[] = map(data.tokens, property('id'));

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
              value => multiply(ethereumPriceOneDayAgo, value?.derivedETH!)
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
                // mappedPricingData[key].id will be a `string`, assuming `key`
                // is present, but `get` resolves to an incorrect type, so must
                // be casted.
                const tokenAddress: string = get(
                  mappedPricingData,
                  `[${key}].id`
                ) as any;
                const relativePriceChange = historicalPrice
                  ? // @ts-expect-error TypeScript disallows string arithmetic,
                    // even though it works correctly.
                    ((currentPrice - historicalPrice) / currentPrice) * 100
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
              type: DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS,
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

/**
 * Fetches a single asset's 24-hour price data from Uniswap.
 *
 * @param address The asset address.
 * @param yesterday The numerical representation of yesterday's date.
 * @returns The loaded price data, or null on failure.
 */
const get24HourPrice = async (
  address: string,
  yesterday: number
): Promise<UniswapPricesQueryData['tokens'][0] | null> => {
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

const callbacksOnAssetReceived: {
  [address: string]: ((asset: ParsedAddressAsset) => unknown) | undefined;
} = {};

/**
 * Saves a callback function to be called when an asset's price is loaded.
 *
 * @param address The asset's address.
 * @param action The callback.
 */
export function scheduleActionOnAssetReceived(
  address: string,
  action: (asset: ParsedAddressAsset) => unknown
) {
  callbacksOnAssetReceived[address.toLowerCase()] = action;
}

/**
 * Handles a `AssetPricesReceivedMessage` from Zerion and updates state.
 *
 * @param message The message, or undefined.
 * @param fromFallback Whether or not this message is provided as a fallback.
 */
export const assetPricesReceived = (
  message: AssetPricesReceivedMessage | undefined,
  fromFallback: boolean = false
) => (
  dispatch: Dispatch<DataUpdateGenericAssetsAction | DataUpdateEthUsdAction>,
  getState: AppGetState
) => {
  if (!fromFallback) {
    disableGenericAssetsFallbackIfNeeded();
  }
  const newAssetPrices = message?.payload?.prices ?? {};
  const { nativeCurrency } = getState().settings;

  if (toLower(nativeCurrency) === message?.meta?.currency) {
    if (isEmpty(newAssetPrices)) return;
    const parsedAssets = mapValues(newAssetPrices, asset =>
      parseAsset(asset)
    ) as {
      [id: string]: ParsedAddressAsset;
    };
    const { genericAssets } = getState().data;

    const updatedAssets = {
      ...genericAssets,
      ...parsedAssets,
    };

    const assetAddresses = Object.keys(parsedAssets);

    for (let address of assetAddresses) {
      callbacksOnAssetReceived[toLower(address)]?.(parsedAssets[address]);
      callbacksOnAssetReceived[toLower(address)] = undefined;
    }

    dispatch({
      payload: updatedAssets,
      type: DATA_UPDATE_GENERIC_ASSETS,
    });
  }
  if (
    message?.meta?.currency?.toLowerCase() ===
      NativeCurrencyKeys.USD.toLowerCase() &&
    newAssetPrices[ETH_ADDRESS]
  ) {
    const value = newAssetPrices[ETH_ADDRESS]?.price?.value;
    dispatch({
      payload: value,
      type: DATA_UPDATE_ETH_USD,
    });
  }
};

/**
 * Handles a `AssetPricesChangedMessage` from Zerion and updates state.
 *
 * @param message The message.
 */
export const assetPricesChanged = (
  message: AssetPricesChangedMessage | undefined
) => (
  dispatch: Dispatch<DataUpdateGenericAssetsAction | DataUpdateEthUsdAction>,
  getState: AppGetState
) => {
  const { nativeCurrency } = getState().settings;

  const price = message?.payload?.prices?.[0]?.price;
  const assetAddress = message?.meta?.asset_code;
  if (isNil(price) || isNil(assetAddress)) return;

  if (nativeCurrency?.toLowerCase() === message?.meta?.currency) {
    const { genericAssets } = getState().data;
    const genericAsset = {
      ...get(genericAssets, assetAddress),
      price,
    };
    const updatedAssets = {
      ...genericAssets,
      [assetAddress]: genericAsset,
    } as {
      [address: string]: ParsedAddressAsset;
    };

    dispatch({
      payload: updatedAssets,
      type: DATA_UPDATE_GENERIC_ASSETS,
    });
  }
  if (
    message?.meta?.currency?.toLowerCase() ===
      NativeCurrencyKeys.USD.toLowerCase() &&
    assetAddress === ETH_ADDRESS
  ) {
    dispatch({
      payload: price?.value,
      type: DATA_UPDATE_ETH_USD,
    });
  }
};

/**
 * Updates state and account local storage with a new transaction.
 *
 * @param txDetails The transaction details to parse.
 * @param accountAddressToUpdate The account to add the transaction to, or null
 * to default to the currently selected account.
 * @param disableTxnWatcher Whether or not to disable the pending transaction
 * watcher.
 * @param provider A `StaticJsonRpcProvider` to use for watching the pending
 * transaction, or null to use the default provider.
 */
export const dataAddNewTransaction = (
  txDetails: NewTransactionOrAddCashTransaction,
  accountAddressToUpdate: string | null = null,
  disableTxnWatcher: boolean = false,
  provider: StaticJsonRpcProvider | null = null
) => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    DataUpdatePendingTransactionSuccessAction
  >,
  getState: AppGetState
) => {
  const { pendingTransactions } = getState().data;
  const { accountAddress, nativeCurrency, network } = getState().settings;
  if (
    accountAddressToUpdate &&
    toLower(accountAddressToUpdate) !== toLower(accountAddress)
  )
    return;
  try {
    const parsedTransaction = await parseNewTransaction(
      txDetails,
      nativeCurrency
    );
    const _pendingTransactions = [parsedTransaction, ...pendingTransactions];
    dispatch({
      payload: _pendingTransactions,
      type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
    });
    saveLocalPendingTransactions(_pendingTransactions, accountAddress, network);
    if (parsedTransaction.from && parsedTransaction.nonce) {
      dispatch(
        incrementNonce(
          parsedTransaction.from,
          parsedTransaction.nonce,
          parsedTransaction.network
        )
      );
    }
    if (
      !disableTxnWatcher ||
      network !== Network.mainnet ||
      parsedTransaction?.network
    ) {
      dispatch(
        watchPendingTransactions(
          accountAddress,
          parsedTransaction.network
            ? TXN_WATCHER_MAX_TRIES_LAYER_2
            : TXN_WATCHER_MAX_TRIES,
          null,
          // @ts-expect-error `watchPendingTransactions` only takes 3 arguments.
          provider
        )
      );
    }
    return parsedTransaction;
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

/**
 * Returns the `TransactionStatus` that represents completion for a given
 * transaction type.
 *
 * @param type The transaction type.
 * @returns The confirmed status.
 */
const getConfirmedState = (type: TransactionType): TransactionStatus => {
  switch (type) {
    case TransactionTypes.authorize:
      return TransactionStatus.approved;
    case TransactionTypes.deposit:
      return TransactionStatus.deposited;
    case TransactionTypes.withdraw:
      return TransactionStatus.withdrew;
    case TransactionTypes.receive:
      return TransactionStatus.received;
    case TransactionTypes.purchase:
      return TransactionStatus.purchased;
    default:
      return TransactionStatus.sent;
  }
};

/**
 * Watches pending transactions and updates state and account local storage
 * when new data is available.
 *
 * @param provider A `StaticJsonRpcProvider`, or null to use the default
 * provider.
 * @param currentNonce The nonce of the last confirmed transaction, used to
 * determine if a transaction has been dropped.
 */
export const dataWatchPendingTransactions = (
  provider: StaticJsonRpcProvider | null = null,
  currentNonce: number = -1
) => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    DataLoadTransactionSuccessAction | DataUpdatePendingTransactionSuccessAction
  >,
  getState: AppGetState
) => {
  const { pendingTransactions: pending } = getState().data;
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
        const txObj = await p.getTransaction(txHash!);
        // if the nonce of last confirmed tx is higher than this pending tx then it got dropped
        const nonceAlreadyIncluded = currentNonce > tx.nonce!;
        if ((txObj?.blockNumber && txObj?.blockHash) || nonceAlreadyIncluded) {
          // When speeding up a non "normal tx" we need to resubscribe
          // because zerion "append" event isn't reliable
          logger.log('TX CONFIRMED!', txObj);
          if (!nonceAlreadyIncluded) {
            appEvents.emit('transactionConfirmed', txObj);
          }
          const minedAt = Math.floor(Date.now() / 1000);
          txStatusesDidChange = true;
          // @ts-expect-error `txObj` is not typed as having a `status` field.
          if (txObj && !isZero(txObj.status)) {
            const isSelf = toLower(tx?.from!) === toLower(tx?.to!);
            const newStatus = getTransactionLabel({
              direction: isSelf
                ? TransactionDirection.self
                : TransactionDirection.out,
              pending: false,
              protocol: tx?.protocol,
              status:
                tx.status === TransactionStatus.cancelling
                  ? TransactionStatus.cancelled
                  : getConfirmedState(tx.type),
              type: tx?.type,
            });
            updatedPending.status = newStatus;
          } else if (nonceAlreadyIncluded) {
            updatedPending.status = TransactionStatus.unknown;
          } else {
            updatedPending.status = TransactionStatus.failed;
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
    const { accountAddress, network } = getState().settings;
    const [newDataTransactions, pendingTransactions] = partition(
      updatedPendingTransactions.filter(
        ({ status }) => status !== TransactionStatus.unknown
      ),
      tx => !tx.pending
    );
    dispatch({
      payload: pendingTransactions,
      type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
    });
    saveLocalPendingTransactions(pendingTransactions, accountAddress, network);

    const { transactions } = getState().data;
    const updatedTransactions = newDataTransactions.concat(transactions);
    dispatch({
      payload: updatedTransactions,
      type: DATA_LOAD_TRANSACTIONS_SUCCESS,
    });
    saveLocalTransactions(updatedTransactions, accountAddress, network);
    dispatch(updatePurchases(updatedTransactions));

    if (!pendingTransactions?.length) {
      return true;
    }
  }
  return false;
};

/**
 * Updates a transaction in state and account local storage and watches it,
 * if `watch` is true.
 *
 * @param txHash The transaction hash to update.
 * @param txObj The updated transaction data.
 * @param watch Whether or not to watch the new transaction.
 * @param provider A `StaticJsonRpcProvider`, or null to use the default
 * provider.
 */
export const dataUpdateTransaction = (
  txHash: string,
  txObj: RainbowTransaction,
  watch: boolean,
  provider: StaticJsonRpcProvider | null = null
) => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    DataUpdatePendingTransactionSuccessAction
  >,
  getState: AppGetState
) => {
  const { pendingTransactions } = getState().data;

  const allOtherTx = pendingTransactions.filter(tx => tx.hash !== txHash);
  const updatedTransactions = [txObj].concat(allOtherTx);

  dispatch({
    payload: updatedTransactions,
    type: DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS,
  });
  const { accountAddress, network } = getState().settings;
  saveLocalPendingTransactions(updatedTransactions, accountAddress, network);
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
};

/**
 * Updates purchases using the `addCash` reducer to reflect new transaction data.
 * Called when new transaction information is loaded.
 *
 * @param updatedTransactions The array of updated transactions.
 */
const updatePurchases = (updatedTransactions: RainbowTransaction[]) => (
  dispatch: ThunkDispatch<AppState, unknown, never>
) => {
  const confirmedPurchases = filter(updatedTransactions, txn => {
    return (
      txn.type === TransactionTypes.purchase &&
      txn.status !== TransactionStatus.purchasing
    );
  });
  dispatch(addCashUpdatePurchases(confirmedPurchases));
};

/**
 * Checks the current account's transaction count and subscribes to pending
 * transaction updates using `dataWatchPendingTransactions`.
 *
 * @param accountAddressToWatch The address to watch. If this does not match
 * the currently selected address, the subscription is not started.
 * @param provider A `StaticJsonRpcProvider`, or null to use the default
 * provider.
 */
export const checkPendingTransactionsOnInitialize = (
  accountAddressToWatch: string,
  provider: StaticJsonRpcProvider | null = null
) => async (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
  const { accountAddress: currentAccountAddress } = getState().settings;
  if (currentAccountAddress !== accountAddressToWatch) return;
  const currentNonce = await (provider || web3Provider).getTransactionCount(
    currentAccountAddress,
    'latest'
  );
  await dispatch(dataWatchPendingTransactions(provider, currentNonce));
};

/**
 * Repeatedly attempts to subscribe to transaction updates using
 * `dataWatchPendingTransactions` until there are no more pending transactions
 * or `remainingTries` attempts are exhausted.
 *
 * @param accountAddressToWatch The account address to watch. If this does
 * not match the currently selected address, the subscription is not started.
 * @param remainingTries The remaining number of attempts.
 * @param provider A `StaticJsonRpcProvider`, or null to use the default
 * provider.
 */
export const watchPendingTransactions = (
  accountAddressToWatch: string,
  remainingTries: number = TXN_WATCHER_MAX_TRIES,
  provider: StaticJsonRpcProvider | null = null
) => async (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
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

/**
 * Updates state to indicate whether or not savings data should be refetched.
 *
 * @param fetch Whether or not savings should be refetched.
 */
export const updateRefetchSavings = (fetch: boolean) => (
  dispatch: Dispatch<DataUpdateRefetchSavingsAction>
) =>
  dispatch({
    payload: fetch,
    type: DATA_UPDATE_REFETCH_SAVINGS,
  });

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: DataState = {
  accountAssetsData: {}, // for account-specific assets
  assetPricesFromUniswap: {},
  ethUSDPrice: null,
  genericAssets: {},
  isLoadingAssets: true,
  isLoadingTransactions: true,
  pendingTransactions: [],
  portfolios: {},
  shouldRefetchSavings: false,
  transactions: [],
  uniswapPricesQuery: null,
  uniswapPricesSubscription: null,
};

export default (state: DataState = INITIAL_STATE, action: DataAction) => {
  switch (action.type) {
    case DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION:
      return {
        ...state,
        uniswapPricesQuery: action.payload.uniswapPricesQuery,
        uniswapPricesSubscription: action.payload.uniswapPricesSubscription,
      };
    case DATA_UPDATE_REFETCH_SAVINGS:
      return { ...state, shouldRefetchSavings: action.payload };
    case DATA_UPDATE_GENERIC_ASSETS:
      return { ...state, genericAssets: action.payload };
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
    case DATA_LOAD_ACCOUNT_ASSETS_DATA_REQUEST:
      return {
        ...state,
        isLoadingAssets: true,
      };
    case DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS:
      return {
        ...state,
        assetPricesFromUniswap: action.payload,
      };
    case DATA_LOAD_ACCOUNT_ASSETS_DATA_RECEIVED: {
      return {
        ...state,
        accountAssetsData: action.payload,
      };
    }
    case DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS: {
      return {
        ...state,
        accountAssetsData: action.payload,
        isLoadingAssets: false,
      };
    }
    case DATA_LOAD_ACCOUNT_ASSETS_DATA_FAILURE:
      return {
        ...state,
        isLoadingAssets: false,
      };
    case DATA_LOAD_ACCOUNT_ASSETS_DATA_FINALIZED: {
      return {
        ...state,
        isLoadingAssets: false,
      };
    }
    case DATA_UPDATE_PENDING_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        pendingTransactions: action.payload,
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

// -- Middlewares ---------------------------------------- //

const FETCHING_TIMEOUT = 10000;
const WAIT_FOR_WEBSOCKET_DATA_TIMEOUT = 3000;

/**
 * Waits until data has finished streaming from the websockets. When finished,
 * the assets loading state will be marked as finalized.
 */
export function loadingAssetsMiddleware({
  dispatch,
}: {
  dispatch: Dispatch<DataLoadAccountAssetsDataFinalizedAction>;
}) {
  let accountAssetsDataFetchingTimeout: NodeJS.Timeout;

  const setLoadingFinished = () => {
    clearTimeout(accountAssetsDataFetchingTimeout);
    dispatch({ type: DATA_LOAD_ACCOUNT_ASSETS_DATA_FINALIZED });
  };
  const debouncedSetLoadingFinished = debounce(
    setLoadingFinished,
    WAIT_FOR_WEBSOCKET_DATA_TIMEOUT
  );

  return (next: Dispatch<AnyAction>) => (action: any) => {
    // If we have received data from the websockets, we want to debounce
    // the finalize state as there could be another event streaming in
    // shortly after.
    if (action.type === DATA_LOAD_ACCOUNT_ASSETS_DATA_RECEIVED) {
      debouncedSetLoadingFinished();
    }

    // On the rare occasion that we can't receive any events from the
    // websocket, we want to set the loading states back to falsy
    // after the timeout has elapsed.
    if (action.type === DATA_LOAD_ACCOUNT_ASSETS_DATA_REQUEST) {
      accountAssetsDataFetchingTimeout = setTimeout(() => {
        setLoadingFinished();
      }, FETCHING_TIMEOUT);
    }

    return next(action);
  };
}
