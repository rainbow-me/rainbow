import { ObservableQuery } from '@apollo/client';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Mutex } from 'async-mutex';
import { getUnixTime, startOfMinute, sub } from 'date-fns';
import isValidDomain from 'is-valid-domain';
import {
  concat,
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
import { MMKV } from 'react-native-mmkv';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { uniswapClient } from '../apollo/client';
import {
  UNISWAP_24HOUR_PRICE_QUERY,
  UNISWAP_PRICES_QUERY,
} from '../apollo/queries';
import { addCashUpdatePurchases } from './addCash';
import { decrementNonce, incrementNonce } from './nonceManager';
import { AppGetState, AppState } from './store';
import { uniqueTokensRefreshState } from './uniqueTokens';
import { uniswapUpdateLiquidityTokens } from './uniswapLiquidity';
import {
  AssetTypes,
  NewTransactionOrAddCashTransaction,
  ParsedAddressAsset,
  RainbowTransaction,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  TransactionTypes,
  ZerionAsset,
  ZerionAssetOrFallback,
  ZerionTransaction,
} from '@rainbow-me/entities';
import appEvents from '@rainbow-me/handlers/appEvents';
import {
  getAccountAssetsData,
  getAssetPricesFromUniswap,
  getLocalTransactions,
  saveAccountAssetsData,
  saveAccountEmptyState,
  saveAssetPricesFromUniswap,
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
import networkTypes, { Network } from '@rainbow-me/networkTypes';
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

function addHiddenCoins(
  coins: string[],
  dispatch: ThunkDispatch<AppState, unknown, never>,
  address: string
) {
  const storageKey = 'hidden-coins-' + address;
  const storageEntity = storage.getString(storageKey);
  const list = storageEntity ? JSON.parse(storageEntity) : [];
  const newList = [...list.filter((i: string) => !coins.includes(i)), ...coins];
  dispatch(setHiddenCoins(newList));
  storage.set(storageKey, JSON.stringify(newList));
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
const DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS =
  'data/DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS';
const DATA_LOAD_ACCOUNT_ASSETS_DATA_FAILURE =
  'data/DATA_LOAD_ACCOUNT_ASSETS_DATA_FAILURE';

const DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS =
  'data/DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS';

const DATA_LOAD_TRANSACTIONS_REQUEST = 'data/DATA_LOAD_TRANSACTIONS_REQUEST';
const DATA_LOAD_TRANSACTIONS_SUCCESS = 'data/DATA_LOAD_TRANSACTIONS_SUCCESS';
const DATA_LOAD_TRANSACTIONS_FAILURE = 'data/DATA_LOAD_TRANSACTIONS_FAILURE';

const DATA_ADD_NEW_TRANSACTION_SUCCESS =
  'data/DATA_ADD_NEW_TRANSACTION_SUCCESS';

const DATA_UPDATE_REFETCH_SAVINGS = 'data/DATA_UPDATE_REFETCH_SAVINGS';

const DATA_CLEAR_STATE = 'data/DATA_CLEAR_STATE';

const mutex = new Mutex();

const withRunExclusive = async <T>(callback: (...args: unknown[]) => T) =>
  await mutex.runExclusive(callback);

// -- Actions ---------------------------------------- //

interface DataState {
  accountAssetsData: {
    [uniqueId: string]: ParsedAddressAsset;
  };
  assetPricesFromUniswap: {
    [address: string]: UniswapAssetPriceData;
  };
  ethUSDCharts: null;
  ethUSDPrice: number | undefined | null;
  genericAssets: {
    [address: string]: ParsedAddressAsset;
  };
  isLoadingAssets: boolean;
  isLoadingTransactions: boolean;
  portfolios: {
    [address: string]: ZerionPortfolio;
  };
  shouldRefetchSavings: boolean;
  transactions: RainbowTransaction[];
  uniswapPricesQuery: ObservableQuery<
    UniswapPricesQueryData,
    UniswapPricesQueryVariables
  > | null;
  uniswapPricesSubscription: ZenObservable.Subscription | null;
}

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
  | DataLoadAccountAssetsDataSuccessAction
  | DataLoadAccountAssetsDataFailureAction
  | DataAddNewTransactionSuccessAction
  | DataClearStateAction;

interface DataUpdateUniswapPricesSubscriptionAction {
  type: typeof DATA_UPDATE_UNISWAP_PRICES_SUBSCRIPTION;
  payload: {
    uniswapPricesQuery: DataState['uniswapPricesQuery'];
    uniswapPricesSubscription: DataState['uniswapPricesSubscription'];
  };
}

interface DataUpdateRefetchSavingsAction {
  type: typeof DATA_UPDATE_REFETCH_SAVINGS;
  payload: boolean;
}

interface UniswapPricesQueryData {
  tokens: {
    id: string;
    derivedETH: string;
    symbol: string;
    name: string;
    decimals: string;
  }[];
}

interface UniswapPricesQueryVariables {
  addresses: string[];
}

interface UniswapAssetPriceData {
  price: string;
  relativePriceChange: number;
  tokenAddress: string;
}

interface CoingeckoApiResponseWithLastUpdate {
  [coingeckoId: string]: {
    [currencyIdOr24hChange: string]: number;
    last_updated_at: number;
  };
}

interface DataUpdateGenericAssetsAction {
  type: typeof DATA_UPDATE_GENERIC_ASSETS;
  payload: DataState['genericAssets'];
}

interface DataUpdatePortfoliosAction {
  type: typeof DATA_UPDATE_PORTFOLIOS;
  payload: DataState['portfolios'];
}

interface DataUpdateEthUsdAction {
  type: typeof DATA_UPDATE_ETH_USD;
  payload: number | undefined;
}

interface DataLoadTransactionsRequestAction {
  type: typeof DATA_LOAD_TRANSACTIONS_REQUEST;
}

interface DataLoadTransactionSuccessAction {
  type: typeof DATA_LOAD_TRANSACTIONS_SUCCESS;
  payload: DataState['transactions'];
}

interface DataLoadTransactionsFailureAction {
  type: typeof DATA_LOAD_TRANSACTIONS_FAILURE;
}

interface DataLoadAccountAssetsDataRequestAction {
  type: typeof DATA_LOAD_ACCOUNT_ASSETS_DATA_REQUEST;
}

interface DataLoadAssetPricesFromUniswapSuccessAction {
  type: typeof DATA_LOAD_ASSET_PRICES_FROM_UNISWAP_SUCCESS;
  payload: DataState['assetPricesFromUniswap'];
}

interface DataLoadAccountAssetsDataSuccessAction {
  type: typeof DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS;
  payload: DataState['accountAssetsData'];
}

interface DataLoadAccountAssetsDataFailureAction {
  type: typeof DATA_LOAD_ACCOUNT_ASSETS_DATA_FAILURE;
}

interface DataAddNewTransactionSuccessAction {
  type: typeof DATA_ADD_NEW_TRANSACTION_SUCCESS;
  payload: DataState['transactions'];
}

interface DataClearStateAction {
  type: typeof DATA_CLEAR_STATE;
}

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

interface PortfolioReceivedMessage {
  payload?: {
    portfolio?: ZerionPortfolio;
  };
  meta?: MessageMeta;
}

interface TransactionsReceivedMessage {
  payload?: {
    transactions?: ZerionTransactionWithNetwork[];
  };
  meta?: MessageMeta;
}

interface TransactionsRemovedMessage {
  payload?: {
    transactions?: ZerionTransaction[];
  };
  meta?: MessageMeta;
}

interface AssetPricesReceivedMessage {
  payload?: {
    prices?: {
      [id: string]: ZerionAssetOrFallback;
    };
  };
  meta?: MessageMeta;
}

interface AssetPricesChangedMessage {
  payload?: {
    prices?: ZerionAsset[];
  };
  meta?: MessageMeta & { asset_code?: string };
}

type DataMessage =
  | AddressAssetsReceivedMessage
  | PortfolioReceivedMessage
  | TransactionsReceivedMessage
  | TransactionsRemovedMessage
  | AssetPricesReceivedMessage
  | AssetPricesChangedMessage;

interface MessageMeta {
  address?: string;
  currency?: string;
  status?: string;
}

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
  relative_change_24h: number;
}

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
  >,
  getState: AppGetState
) =>
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

export const fetchCoingeckoIds = async () => {
  let ids: typeof coingeckoIdsFallback;
  try {
    const request = await fetch(COINGECKO_IDS_ENDPOINT);
    ids = await request.json();
  } catch (e) {
    ids = coingeckoIdsFallback;
  }

  const idsMap: {
    [address: string]: string;
  } = {};
  ids.forEach(({ id, platforms: { ethereum: tokenAddress } }) => {
    const address = tokenAddress && toLower(tokenAddress);
    if (address && address.substr(0, 2) === '0x') {
      idsMap[address] = id;
    }
  });
  return idsMap;
};

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

  const allAssets: ZerionAssetOrFallback[] = [
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

  // At this point, `allPrices` will include the `coingecko_id` field, but it
  // is not included as part of the `ZerionAsset` that it is meant to conform
  // to.
  const allPrices: {
    [id: string]: ZerionAssetOrFallback;
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

export const disableGenericAssetsFallbackIfNeeded = () => {
  if (genericAssetsHandle) {
    clearTimeout(genericAssetsHandle);
  }
};

export const dataResetState = () => (
  dispatch: Dispatch<DataClearStateAction>,
  getState: AppGetState
) => {
  const { uniswapPricesSubscription } = getState().data;
  (uniswapPricesSubscription?.unsubscribe as any)?.unsubscribe();
  pendingTransactionsHandle && clearTimeout(pendingTransactionsHandle);
  genericAssetsHandle && clearTimeout(genericAssetsHandle);
  dispatch({ type: DATA_CLEAR_STATE });
};

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

type ZerionTransactionWithNetwork = ZerionTransaction & {
  network: Network;
};

const checkForUpdatedNonce = (
  transactionData: ZerionTransactionWithNetwork[]
) => (dispatch: ThunkDispatch<AppState, unknown, never>) => {
  const txSortedByDescendingNonce = transactionData.sort(
    // @ts-expect-error TypeScript prevents this subtraction since `n1` or `n2`
    // may be null, but subtracting null and a number is possible.
    ({ nonce: n1 }, { nonce: n2 }) => n2 - n1
  );
  const [latestTx] = txSortedByDescendingNonce;
  const { address_from, network, nonce } = latestTx;
  dispatch(incrementNonce(address_from!, nonce!, network));
};

const checkForRemovedNonce = (
  removedTransactions: ZerionTransactionWithNetwork[]
) => (dispatch: ThunkDispatch<AppState, unknown, never>) => {
  const txSortedByAscendingNonce = removedTransactions.sort(
    // @ts-expect-error TypeScript prevents this subtraction since `n1` or `n2`
    // may be null, but subtracting null and a number is possible.
    ({ nonce: n1 }, { nonce: n2 }) => n1 - n2
  );
  const [lowestNonceTx] = txSortedByAscendingNonce;
  const { address_from, network, nonce } = lowestNonceTx;
  dispatch(decrementNonce(address_from!, nonce!, network));
};

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

export const transactionsReceived = (
  message: TransactionsReceivedMessage | undefined,
  appended = false
) => async (
  dispatch: ThunkDispatch<AppState, unknown, DataLoadTransactionSuccessAction>,
  getState: AppGetState
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
      type: DATA_LOAD_TRANSACTIONS_SUCCESS,
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

export const transactionsRemoved = (
  message: TransactionsRemovedMessage | undefined
) => async (
  dispatch: ThunkDispatch<AppState, unknown, DataLoadTransactionSuccessAction>,
  getState: AppGetState
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
      type: DATA_LOAD_TRANSACTIONS_SUCCESS,
    });
    dispatch(checkForRemovedNonce(removedTransactions as any));
    saveLocalTransactions(updatedTransactions, accountAddress, network);
  });

export const addressAssetsReceived = (
  message: AddressAssetsReceivedMessage,
  append: boolean = false,
  change: boolean = false,
  removed: boolean = false,
  assetsNetwork: Network | string | null = null
) => (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    DataLoadAccountAssetsDataSuccessAction
  >,
  getState: AppGetState
) => {
  const isValidMeta = dispatch(checkMeta(message));
  if (!isValidMeta) return;
  const { accountAddress, network } = getState().settings;
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
    type: DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS,
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

const get24HourPrice = async (address: string, yesterday: number) => {
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

export function scheduleActionOnAssetReceived(
  address: string,
  action: (asset: ParsedAddressAsset) => unknown
) {
  callbacksOnAssetReceived[address.toLowerCase()] = action;
}

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
  if (message?.meta?.currency === 'usd' && newAssetPrices[ETH_ADDRESS]) {
    const value = newAssetPrices[ETH_ADDRESS]?.price?.value;
    dispatch({
      payload: value,
      type: DATA_UPDATE_ETH_USD,
    });
  }
};

export const assetPricesChanged = (
  message: AssetPricesChangedMessage | undefined
) => (
  dispatch: Dispatch<DataUpdateGenericAssetsAction>,
  getState: AppGetState
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
  } as {
    [address: string]: ParsedAddressAsset;
  };

  dispatch({
    payload: updatedAssets,
    type: DATA_UPDATE_GENERIC_ASSETS,
  });
};

export const dataAddNewTransaction = (
  txDetails: NewTransactionOrAddCashTransaction,
  accountAddressToUpdate: string | null = null,
  disableTxnWatcher: boolean = false,
  provider: StaticJsonRpcProvider | null = null
) => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    DataAddNewTransactionSuccessAction
  >,
  getState: AppGetState
) =>
  withRunExclusive(
    async (): Promise<RainbowTransaction | undefined> => {
      const { transactions } = getState().data;
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
        const _transactions = [parsedTransaction, ...transactions];
        dispatch({
          payload: _transactions,
          type: DATA_ADD_NEW_TRANSACTION_SUCCESS,
        });
        saveLocalTransactions(_transactions, accountAddress, network);
        if (parsedTransaction.from && parsedTransaction.nonce) {
          await dispatch(
            incrementNonce(
              parsedTransaction.from,
              parsedTransaction.nonce,
              parsedTransaction.network
            )
          );
        }
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
              // @ts-expect-error `watchPendingTransactions` only takes 3 arguments.
              provider
            )
          );
        }
        return parsedTransaction;
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }
  );

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

export const dataWatchPendingTransactions = (
  provider: StaticJsonRpcProvider | null = null,
  currentNonce: number = -1
) => async (
  dispatch: ThunkDispatch<AppState, unknown, DataLoadTransactionSuccessAction>,
  getState: AppGetState
) =>
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
          const txObj = await p.getTransaction(txHash!);
          // if the nonce of last confirmed tx is higher than this pending tx then it got dropped
          const nonceAlreadyIncluded = currentNonce > tx.nonce!;
          if ((txObj?.blockNumber && txObj.blockHash) || nonceAlreadyIncluded) {
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
      const filteredPendingTransactions = updatedPendingTransactions?.filter(
        ({ status }) => status !== TransactionStatus.unknown
      );
      const updatedTransactions = concat(
        filteredPendingTransactions,
        remainingTransactions
      );
      dispatch(updatePurchases(updatedTransactions));
      const { accountAddress, network } = getState().settings;
      dispatch({
        payload: updatedTransactions,
        type: DATA_LOAD_TRANSACTIONS_SUCCESS,
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
  txHash: string,
  txObj: RainbowTransaction,
  watch: boolean,
  provider: StaticJsonRpcProvider | null = null
) => async (
  dispatch: ThunkDispatch<AppState, unknown, DataLoadTransactionSuccessAction>,
  getState: AppGetState
) =>
  withRunExclusive(async () => {
    const { transactions } = getState().data;

    const allOtherTx = transactions.filter(tx => tx.hash !== txHash);
    const updatedTransactions = [txObj].concat(allOtherTx);

    dispatch({
      payload: updatedTransactions,
      type: DATA_LOAD_TRANSACTIONS_SUCCESS,
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
  ethUSDCharts: null,
  ethUSDPrice: null,
  genericAssets: {},
  isLoadingAssets: true,
  isLoadingTransactions: true,
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
      return { ...state, assetPricesFromUniswap: action.payload };
    case DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS:
      return {
        ...state,
        accountAssetsData: action.payload,
        isLoadingAssets: false,
      };
    case DATA_LOAD_ACCOUNT_ASSETS_DATA_FAILURE:
      return {
        ...state,
        isLoadingAssets: false,
      };
    case DATA_ADD_NEW_TRANSACTION_SUCCESS:
      return {
        ...state,
        transactions: action.payload,
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
