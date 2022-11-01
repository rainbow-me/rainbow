import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import { isEmpty, keyBy, mapValues, uniqBy } from 'lodash';
import isEqual from 'react-fast-compare';
import {
  // @ts-ignore
  ETHERSCAN_API_KEY,
} from 'react-native-dotenv';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { AdditionalAssetsDataState } from './additionalAssetsData';
import {
  addressAssetsReceived,
  DataState,
  DISPERSION_SUCCESS_CODE,
  fetchAssetPricesWithCoingecko,
  MessageMeta,
} from './data';
import { emitMainnetAssetDiscoveryRequest, explorerInitL2 } from './explorer';
import { AppGetState, AppState } from './store';
import {
  AssetType,
  ParsedAddressAsset,
  ZerionAsset,
  ZerionAssetFallback,
  ZerionAssetPrice,
} from '@/entities';
import { getAssetsFromCovalent } from '@/handlers/covalent';
import { web3Provider } from '@/handlers/web3';
import networkInfo from '@/helpers/networkInfo';
import { Network } from '@/helpers/networkTypes';
import {
  balanceCheckerContractAbi,
  chainAssets,
  COVALENT_ETH_ADDRESS,
  ETH_ADDRESS,
  ETH_COINGECKO_ID,
  migratedTokens,
} from '@/references';
import { delay } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import logger from '@/utils/logger';

let lastUpdatePayload: FallbackOnChainAssetsPayload | null = null;

// -- Constants --------------------------------------- //
const FALLBACK_EXPLORER_CLEAR_STATE = 'explorer/FALLBACK_EXPLORER_CLEAR_STATE';
const FALLBACK_EXPLORER_SET_ASSETS = 'explorer/FALLBACK_EXPLORER_SET_ASSETS';
const FALLBACK_EXPLORER_SET_BALANCE_HANDLER =
  'explorer/FALLBACK_EXPLORER_SET_BALANCE_HANDLER';
const FALLBACK_EXPLORER_SET_HANDLERS =
  'explorer/FALLBACK_EXPLORER_SET_HANDLERS';
const FALLBACK_EXPLORER_SET_LATEST_TX_BLOCK_NUMBER =
  'explorer/FALLBACK_EXPLORER_SET_LATEST_TX_BLOCK_NUMBER';

const ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT =
  '0x0000000000000000000000000000000000000000';

const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 10000;
const DISCOVER_NEW_ASSETS_FREQUENCY = 13000;

// -- Types ------------------------------------------- //

/**
 * The state for the `fallbackExplorer` reducer.
 */
interface FallbackExplorerState {
  /**
   * A timeout ID for loading assets, if a timeout has been set.
   */
  fallbackExplorerAssetsHandle: ReturnType<typeof setTimeout> | null;

  /**
   * A timeout ID for loading balances, if a timeout has been set.
   */
  fallbackExplorerBalancesHandle: ReturnType<typeof setTimeout> | null;

  /**
   * The latest loaded transaction's block number.
   */
  latestTxBlockNumber: number | null;

  /**
   * Loaded mainnet asset data.
   */
  mainnetAssets: {
    [key: string]: { asset: ZerionAssetFallback };
  };
}

/**
 * An action for the `fallbackExplorer` reducer.
 */
type FallbackExplorerAction =
  | FallbackExplorerSetAssetsAction
  | FallbackExplorerClearStateAction
  | FallbackExplorerSetLatestTxBlockNumberAction
  | FallbackExplorerSetHandlersAction
  | FallbackExplorerSetBalanceHandlerAction;

/**
 * An action that sets the loaded mainnet assets for the `fallbackExplorer` reducer.
 */
interface FallbackExplorerSetAssetsAction {
  type: typeof FALLBACK_EXPLORER_SET_ASSETS;
  payload: {
    mainnetAssets: FallbackExplorerState['mainnetAssets'];
  };
}

/**
 * An action that clears the `fallbackExplorer` reducer state.
 */
interface FallbackExplorerClearStateAction {
  type: typeof FALLBACK_EXPLORER_CLEAR_STATE;
}

/**
 * An action that updates the latest transaction's block number.
 */
interface FallbackExplorerSetLatestTxBlockNumberAction {
  type: typeof FALLBACK_EXPLORER_SET_LATEST_TX_BLOCK_NUMBER;
  payload: {
    latestTxBlockNumber: number;
  };
}

/**
 * An action for setting the asset and balance timeout handlers.
 */
interface FallbackExplorerSetHandlersAction {
  type: typeof FALLBACK_EXPLORER_SET_HANDLERS;
  payload: {
    fallbackExplorerAssetsHandle: ReturnType<typeof setTimeout> | null;
    fallbackExplorerBalancesHandle: ReturnType<typeof setTimeout>;
  };
}

/**
 * An action for setting the balance timeout handler.
 */
interface FallbackExplorerSetBalanceHandlerAction {
  type: typeof FALLBACK_EXPLORER_SET_BALANCE_HANDLER;
  payload: {
    fallbackExplorerBalancesHandle: ReturnType<typeof setTimeout>;
  };
}

/**
 * A fallback asset's data, which includes a `ZerionAssetFallback` as well
 * as a quantity.
 */
interface FallbackAssetWithQuantity {
  asset: ZerionAssetFallback;
  quantity: number | string;
}

/**
 * A callback function used when assets are loaded from a mainnet asset
 * discovery query.
 */
type AssetDiscoveryCallback = (
  data: {
    [assetCode: string]: { asset: ZerionAsset } | FallbackAssetWithQuantity;
  } | null
) => unknown;

/**
 * A fallback asset's data loaded in `fetchOnchainBalances`, which is similar
 * to a `FallbackAssetWithQuantity`, but its asset's `coingecko_id` and `price`
 * fields may or may not be specified.
 */
interface FallbackOnChainAssetWithQuantity {
  asset: Omit<ZerionAssetFallback, 'coingecko_id' | 'price'> & {
    coingecko_id?: ZerionAssetFallback['coingecko_id'];
    price?: Partial<ZerionAssetFallback['price']>;
  };
  quantity?: number | string;
}

/**
 * A payload for an on-chain asset update.
 */
interface FallbackOnChainAssetsPayload {
  assets: {
    [key: string]: FallbackOnChainAssetWithQuantity;
  };
}

/**
 * A response message from a mainnet asset discovery query.
 */
export interface MainnetAssetDiscoveryMessage {
  payload?: {
    assets: {
      [assetCode: string]: { asset: ZerionAsset } | FallbackAssetWithQuantity;
    };
  };
  meta?: MessageMeta;
}

/**
 * Data from the Etherscan API about an token transaction for a given account.
 * See https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-erc20-token-transfer-events-by-address.
 */
interface EtherscanApiAccountTokenTxResult {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

// -- Actions ---------------------------------------- //

// Some contracts like SNX / SUSD use an ERC20 proxy
// some of those tokens have been migrated to a new address
// We need to use the current address to fetch the correct price
const getCurrentAddress = (address: string) => {
  return migratedTokens[address as keyof typeof migratedTokens] || address;
};

/**
 * Finds new assets to watch for the current state using `findAssetsToWatch`,
 * and updates the state accordingly.
 */
const findNewAssetsToWatch = () => async (
  dispatch: Dispatch<
    | FallbackExplorerSetAssetsAction
    | FallbackExplorerSetLatestTxBlockNumberAction
  >,
  getState: AppGetState
) => {
  const { accountAddress } = getState().settings;
  const { mainnetAssets, latestTxBlockNumber } = getState().fallbackExplorer;
  const { coingeckoIds } = getState().additionalAssetsData;

  const newAssets = await findAssetsToWatch(
    accountAddress,
    latestTxBlockNumber,
    dispatch,
    coingeckoIds
  );

  if (newAssets.length > 0) {
    logger.log('😬 Found new assets!', newAssets);

    // dedupe
    const newMainnetAssets = {
      ...mainnetAssets,
      ...newAssets,
    };

    dispatch({
      payload: {
        mainnetAssets: newMainnetAssets as FallbackExplorerState['mainnetAssets'],
      },
      type: FALLBACK_EXPLORER_SET_ASSETS,
    });
  }
};

/**
 * Gets the price for an asset from the given data.
 *
 * @param contractAddress The asset's contract address.
 * @param updatedAt When the asset price was updated.
 * @param genericAssets An object mapping addresses to generic assets.
 * @param quoteRate The ETH quote rate.
 * @returns The asset price.
 */
const getPrice = (
  contractAddress: string,
  updatedAt: number,
  genericAssets: {
    [assetAddress: string]: ParsedAddressAsset;
  },
  quoteRate: number
): ZerionAssetPrice => {
  const isETH =
    // @ts-expect-error This incorrectly compares the result of a function call
    // to a function.
    contractAddress.toLowerCase() === COVALENT_ETH_ADDRESS.toLowerCase;
  if (isETH) {
    contractAddress = ETH_ADDRESS;
  }

  let price = {
    changed_at: updatedAt,
    relative_change_24h: 0,
    value: isETH ? quoteRate : 0,
  };

  // Overrides
  const fallbackAsset =
    ethereumUtils.getAccountAsset(contractAddress) ||
    genericAssets[contractAddress?.toLowerCase()];

  if (fallbackAsset) {
    price = {
      ...price,
      ...fallbackAsset.price,
    };
  }
  return {
    // @ts-expect-error 'value' is specified more than once.
    value: 0,
    ...price,
  };
};

/**
 * Fetches asset data for an account from Covalent.
 *
 * @param chainId The chain ID.
 * @param accountAddress The account address.
 * @param type The `AssetType` to load.
 * @param currency The currency to use.
 * @param coingeckoIds A mapping of contract addresses to Coingecko IDs.
 * @param genericAssets A mapping of contract addresses to generic assets, as a
 * fallback.
 * @returns An object mapping contract addresses to fallback assets with
 * their quantities for the specified account address.
 */
const getMainnetAssetsFromCovalent = async (
  chainId: number,
  accountAddress: string,
  type: AssetType,
  currency: string,
  coingeckoIds: AdditionalAssetsDataState['coingeckoIds'],
  genericAssets: DataState['genericAssets']
): Promise<{ [assetCode: string]: FallbackAssetWithQuantity } | null> => {
  const data = await getAssetsFromCovalent(chainId, accountAddress, currency);
  if (data) {
    const updatedAt = new Date(data.updated_at).getTime();
    const assets = data.items.map(item => {
      let contractAddress = item.contract_address ?? '';
      const isETH =
        contractAddress.toLowerCase() === COVALENT_ETH_ADDRESS.toLowerCase();
      if (isETH) {
        contractAddress = ETH_ADDRESS;
      }

      const coingeckoId = coingeckoIds[contractAddress.toLowerCase()];

      return {
        asset: {
          asset_code: contractAddress,
          coingecko_id: coingeckoId,
          decimals: item.contract_decimals,
          icon_url: item.logo_url,
          name: item.contract_name,
          price: getPrice(
            contractAddress,
            updatedAt,
            genericAssets,
            item.quote_rate
          ),
          symbol: item.contract_ticker_symbol,
          type,
        },
        quantity: item.balance,
      };
    });

    return keyBy(assets, 'asset.asset_code');
  }
  return null;
};

/**
 * Finds new assets to watch given an account address and a block number using
 * `discoverTokens`.
 *
 * @param address The account address.
 * @param latestTxBlockNumber The latest transaction block number, which is used
 * as the starting block number to load.
 * @param dispatch
 * @param coingeckoIds
 * @returns The assets found as an object keyed by contract address, or an
 * empty array.
 */
const findAssetsToWatch = async (
  address: string,
  latestTxBlockNumber: number | null,
  dispatch: Dispatch<FallbackExplorerSetLatestTxBlockNumberAction>,
  coingeckoIds: AdditionalAssetsDataState['coingeckoIds']
) => {
  const COINGECKO_ETH = {
    asset: {
      asset_code: ETH_ADDRESS,
      coingecko_id: ETH_COINGECKO_ID,
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
  };
  // 1 - Discover the list of tokens for the address
  const tokensInWallet = await discoverTokens(
    coingeckoIds,
    address,
    latestTxBlockNumber,
    dispatch
  );
  if (tokensInWallet.length === 0) {
    return [COINGECKO_ETH];
  }

  const tokens = [...tokensInWallet, COINGECKO_ETH];
  return keyBy(tokens, 'asset.asset_code');
};

/**
 * Returns an `AssetType` for a transaction.
 *
 * @param tx The transaction.
 * @returns The asset type, or undefined if the transaction does not match a
 * known `AssetType`.
 */
const getTokenType = (
  tx: EtherscanApiAccountTokenTxResult
): AssetType | undefined => {
  if (tx.tokenSymbol === 'UNI-V1') return AssetType.uniswap;
  if (tx.tokenSymbol === 'UNI-V2') return AssetType.uniswapV2;
  if (
    tx.tokenName.toLowerCase().indexOf('compound') !== -1 &&
    tx.tokenSymbol !== 'COMP'
  )
    return AssetType.compound;
  return undefined;
};

/**
 * Finds assets for a given address after a given block number, and updates
 * state accordingly.
 *
 * @param coingeckoIds A mapping of asset addresses to Coingecko IDs, used for
 * including Coingecko IDs in the result.
 * @param address The account address.
 * @param latestTxBlockNumber The latest transaction block number, which is used
 * as the starting block number to load.
 * @param dispatch The dispatch object.
 * @returns An array of found assets.
 */
const discoverTokens = async (
  coingeckoIds: AdditionalAssetsDataState['coingeckoIds'],
  address: string,
  latestTxBlockNumber: number | null,
  dispatch: Dispatch<FallbackExplorerSetLatestTxBlockNumberAction>
): Promise<{ asset: ZerionAssetFallback }[]> => {
  let page = 1;
  const offset = 1000;
  let allTxs: EtherscanApiAccountTokenTxResult[] = [];
  let poll = true;
  while (poll) {
    const txs = await getTokenTxDataFromEtherscan(
      address,
      page,
      offset,
      latestTxBlockNumber
    );
    if (txs && txs.length > 0) {
      allTxs = allTxs.concat(txs);
      if (txs.length < offset) {
        // Last page
        poll = false;
      } else {
        // Keep polling
        page++;
        await delay(260);
      }
    } else {
      // No txs
      poll = false;
    }
  }

  // Filter txs by contract address
  if (allTxs.length > 0) {
    const nextlatestTxBlockNumber = Number(allTxs[0].blockNumber) + 1;
    dispatch({
      payload: {
        latestTxBlockNumber: nextlatestTxBlockNumber,
      },
      type: FALLBACK_EXPLORER_SET_LATEST_TX_BLOCK_NUMBER,
    });

    return uniqBy(
      allTxs.map(tx => {
        const type = getTokenType(tx);
        return {
          asset: {
            asset_code: getCurrentAddress(tx.contractAddress.toLowerCase()),
            coingecko_id: coingeckoIds[tx.contractAddress.toLowerCase()],
            decimals: Number(tx.tokenDecimal),
            name: tx.tokenName,
            symbol: tx.tokenSymbol,
            type,
          },
        };
      }),
      token => token.asset.asset_code
    );
  }
  return [];
};

/**
 * Loads token transaction data from the Etherscan API.
 *
 * @param address The account address.
 * @param page The page of results to load.
 * @param offset The offset of results to load.
 * @param latestTxBlockNumber The latest transaction block number, which is used
 * as the starting block number to load.
 * @returns The data loaded from Etherscan, or `null` if an error occurs.
 */
const getTokenTxDataFromEtherscan = async (
  address: string,
  page: number,
  offset: number,
  latestTxBlockNumber: number | null
): Promise<EtherscanApiAccountTokenTxResult[] | null> => {
  let url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=${page}&offset=${offset}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  if (latestTxBlockNumber) {
    url += `&startBlock=${latestTxBlockNumber}`;
  }
  const request = await fetch(url);
  const { status, result } = await request.json();
  if (status === '1' && result?.length > 0) {
    return result;
  }
  return null;
};

/**
 * Fetches balances for tokens for a given address.
 *
 * @param tokens The tokens to find balances for.
 * @param address The account address.
 * @param network The network to use.
 * @returns An object mapping token addresses to balances, or `null` if an error
 * occurs.
 */
const fetchAssetBalances = async (
  tokens: string[],
  address: string,
  network: Network
): Promise<{ [tokenAddress: string]: string } | null> => {
  const balanceCheckerContract = new Contract(
    networkInfo[network]?.balance_checker_contract_address,
    balanceCheckerContractAbi,
    web3Provider
  );
  try {
    const values = await balanceCheckerContract.balances([address], tokens);
    const balances: {
      [address: string]: { [tokenAddress: string]: string };
    } = {};
    [address].forEach((addr, addrIdx) => {
      balances[addr] = {};
      tokens.forEach((tokenAddr, tokenIdx) => {
        const balance = values[addrIdx * tokens.length + tokenIdx];
        balances[addr][tokenAddr] = balance.toString();
      });
    });
    return balances[address];
  } catch (e) {
    logger.sentry(
      'Error fetching balances from balanceCheckerContract',
      network,
      e
    );
    captureException(new Error('fallbackExplorer::balanceChecker failure'));
    return null;
  }
};

/**
 * The queue of callback functions to call for asset discovery queries.
 */
const assetDiscoveryCallbackQueue: {
  [queueKey: string]: AssetDiscoveryCallback[] | undefined;
} = {};

/**
 * Handles an incoming mainnet asset discovery message, calling the appropriate
 * callback.
 *
 * @param response The discovery message.
 */
export const onMainnetAssetDiscoveryResponse = (
  response: MainnetAssetDiscoveryMessage
) => {
  const queueKey =
    response?.meta?.address?.toLowerCase()! +
    response?.meta?.currency?.toLowerCase()!;
  const callbacks = assetDiscoveryCallbackQueue[queueKey];
  if (!callbacks) {
    return;
  }
  assetDiscoveryCallbackQueue[queueKey] = undefined;
  for (let callback of callbacks) {
    callback(response.payload!.assets);
  }
};

/**
 * Fetches on-chain balances given the current state using `fetchAssetBalances`,
 * and updates the state accordingly. Polls for results if necessary.
 *
 * @param options.keepPolling Whether or not to poll if no results are loaded.
 * @param options.withPrices Whether or not to include asset prices.
 */
export const fetchOnchainBalances = ({
  keepPolling = true,
  withPrices = true,
}) => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    FallbackExplorerSetHandlersAction | FallbackExplorerSetBalanceHandlerAction
  >,
  getState: AppGetState
) => {
  logger.log('😬 FallbackExplorer:: fetchOnchainBalances');
  const { network, accountAddress, nativeCurrency } = getState().settings;
  const { accountAssetsData, genericAssets } = getState().data;
  const { coingeckoIds } = getState().additionalAssetsData;
  const formattedNativeCurrency = nativeCurrency.toLowerCase();
  const { mainnetAssets } = getState().fallbackExplorer;
  const callback = async (
    covalentMainnetAssets: Parameters<AssetDiscoveryCallback>[0]
  ) => {
    const chainAssetsMap = keyBy(
      chainAssets[network as keyof typeof chainAssets],
      'asset.asset_code'
    );

    let assets =
      network === Network.mainnet
        ? covalentMainnetAssets
          ? {
              ...mainnetAssets,
              ...covalentMainnetAssets,
            }
          : mainnetAssets
        : chainAssetsMap;

    const isEmptyAssets = isEmpty(assets);
    if (isEmptyAssets && !isEmpty(accountAssetsData)) {
      assets = mapValues(accountAssetsData, asset => ({
        asset: {
          asset_code: asset.address,
          decimals: asset.decimals,
          icon_url: asset.icon_url,
          name: asset.name,
          price: asset.price,
          symbol: asset.symbol,
        },
        quantity: 0,
      })) as typeof assets;
    }

    if (isEmptyAssets || (isEmptyAssets && keepPolling)) {
      const fallbackExplorerBalancesHandle = setTimeout(
        () => dispatch(fetchOnchainBalances({ keepPolling, withPrices })),
        10000
      );
      dispatch({
        payload: {
          fallbackExplorerBalancesHandle,
        },
        type: FALLBACK_EXPLORER_SET_BALANCE_HANDLER,
      });
      return;
    }

    const tokenAddresses = Object.values(
      assets
    ).map(({ asset: { asset_code } }) =>
      asset_code === ETH_ADDRESS
        ? ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT
        : asset_code.toLowerCase()
    );

    const balances = await fetchAssetBalances(
      tokenAddresses,
      accountAddress,
      network
    );

    let updatedAssets: {
      [key: string]: Omit<typeof assets[keyof typeof assets], 'asset'> & {
        asset: typeof assets[keyof typeof assets]['asset'] & {
          coingecko_id?: string;
        };
      };
    } = assets;
    if (balances) {
      updatedAssets = mapValues(assets, assetAndQuantity => {
        const assetCode = assetAndQuantity.asset.asset_code.toLowerCase();
        return {
          asset: {
            ...assetAndQuantity.asset,
            asset_code:
              assetCode === ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT
                ? ETH_ADDRESS
                : assetCode,
          },
          quantity:
            balances?.[
              assetCode === ETH_ADDRESS
                ? ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT
                : assetCode
            ],
        };
      }) as typeof updatedAssets;
    }

    if (withPrices) {
      const coingeckoIds = Object.values(updatedAssets).map(
        ({ asset: { coingecko_id } }) => coingecko_id
      );
      const prices = await fetchAssetPricesWithCoingecko(
        coingeckoIds,
        formattedNativeCurrency
      );

      if (prices) {
        updatedAssets = mapValues(updatedAssets, asset => {
          const assetCoingeckoId = asset.asset.coingecko_id?.toLowerCase();
          if (assetCoingeckoId && prices[assetCoingeckoId]) {
            return {
              ...asset,
              asset: {
                ...asset.asset,
                price: {
                  changed_at: prices[assetCoingeckoId].last_updated_at,
                  relative_change_24h:
                    prices[assetCoingeckoId][
                      `${formattedNativeCurrency}_24h_change`
                    ],
                  value: prices[assetCoingeckoId][`${formattedNativeCurrency}`],
                },
              },
            };
          }
          return asset;
        }) as typeof updatedAssets;
      }
    }

    logger.log('😬 FallbackExplorer updating assets');

    const newPayload = { assets: updatedAssets };

    if (balances && (!keepPolling || !isEqual(lastUpdatePayload, newPayload))) {
      dispatch(
        addressAssetsReceived(
          {
            meta: {
              address: accountAddress,
              currency: nativeCurrency,
              status: DISPERSION_SUCCESS_CODE,
            },
            payload: newPayload,
          },
          false,
          false,
          false,
          network
        )
      );
      lastUpdatePayload = newPayload;
    }

    if (keepPolling) {
      const fallbackExplorerBalancesHandle = setTimeout(
        () => dispatch(fetchOnchainBalances({ keepPolling, withPrices })),
        UPDATE_BALANCE_AND_PRICE_FREQUENCY
      );
      let fallbackExplorerAssetsHandle = null;
      if (Network.mainnet === network) {
        fallbackExplorerAssetsHandle = setTimeout(
          () => dispatch(findNewAssetsToWatch()),
          DISCOVER_NEW_ASSETS_FREQUENCY
        );
      }

      dispatch({
        payload: {
          fallbackExplorerAssetsHandle,
          fallbackExplorerBalancesHandle,
        },
        type: FALLBACK_EXPLORER_SET_HANDLERS,
      });
    }
  };

  if (network === Network.mainnet) {
    const receiveCovalentResponse = (
      assets: Parameters<AssetDiscoveryCallback>[0]
    ) => {
      // Fix prices
      const parsedAssets: Parameters<AssetDiscoveryCallback>[0] = {};
      for (let [key, asset] of Object.entries(assets!)) {
        parsedAssets[key] = {
          ...asset,
          asset: {
            ...asset.asset,
            price: getPrice(
              asset.asset.asset_code,
              (asset.asset.price as any)?.updatedAt,
              genericAssets,
              asset.asset.price?.value!
            ),
          },
        } as typeof parsedAssets[keyof typeof parsedAssets];
      }

      callback(parsedAssets);
    };

    dispatch(emitMainnetAssetDiscoveryRequest);
    const queueKey =
      accountAddress.toLowerCase() + nativeCurrency.toLowerCase();
    assetDiscoveryCallbackQueue[queueKey] =
      assetDiscoveryCallbackQueue[queueKey] ?? [];
    assetDiscoveryCallbackQueue[queueKey]!.push(receiveCovalentResponse);
  } else {
    const chainId = ethereumUtils.getChainIdFromNetwork(network);
    const covalentMainnetAssets = await getMainnetAssetsFromCovalent(
      chainId,
      accountAddress,
      AssetType.token,
      formattedNativeCurrency,
      coingeckoIds,
      genericAssets
    );
    callback(covalentMainnetAssets);
  }
};

/**
 * Initializes the `fallbackExplorer` state, finding assets and fetching
 * balances if necessary.
 */
export const fallbackExplorerInit = () => async (
  dispatch: ThunkDispatch<AppState, unknown, FallbackExplorerSetAssetsAction>,
  getState: AppGetState
) => {
  const { accountAddress, network } = getState().settings;
  const { latestTxBlockNumber, mainnetAssets } = getState().fallbackExplorer;
  const { coingeckoIds } = getState().additionalAssetsData;
  // If mainnet, we need to get all the info
  // 1 - Coingecko ids
  // 2 - All tokens list
  // 3 - Etherscan token transfer transactions
  if (Network.mainnet === network) {
    const newMainnetAssets = (await findAssetsToWatch(
      accountAddress,
      latestTxBlockNumber,
      dispatch,
      coingeckoIds
    )) as FallbackExplorerState['mainnetAssets'];

    await dispatch({
      payload: {
        mainnetAssets: {
          ...mainnetAssets,
          ...newMainnetAssets,
        },
      },
      type: FALLBACK_EXPLORER_SET_ASSETS,
    });
    dispatch(explorerInitL2());
  }

  dispatch(fetchOnchainBalances({ keepPolling: true, withPrices: true }));
};

/**
 * Clears the `fallbackExplorer` state.
 */
export const fallbackExplorerClearState = () => (
  dispatch: Dispatch<FallbackExplorerClearStateAction>,
  getState: AppGetState
) => {
  const {
    fallbackExplorerBalancesHandle,
    fallbackExplorerAssetsHandle,
  } = getState().fallbackExplorer;

  fallbackExplorerBalancesHandle &&
    clearTimeout(fallbackExplorerBalancesHandle);
  fallbackExplorerAssetsHandle && clearTimeout(fallbackExplorerAssetsHandle);
  dispatch({ type: FALLBACK_EXPLORER_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: FallbackExplorerState = {
  fallbackExplorerAssetsHandle: null,
  fallbackExplorerBalancesHandle: null,
  latestTxBlockNumber: null,
  mainnetAssets: {},
};

export default (
  state: FallbackExplorerState = INITIAL_STATE,
  action: FallbackExplorerAction
): FallbackExplorerState => {
  switch (action.type) {
    case FALLBACK_EXPLORER_SET_ASSETS:
      return {
        ...state,
        mainnetAssets: action.payload.mainnetAssets,
      };
    case FALLBACK_EXPLORER_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    case FALLBACK_EXPLORER_SET_LATEST_TX_BLOCK_NUMBER:
      return {
        ...state,
        latestTxBlockNumber: action.payload.latestTxBlockNumber,
      };
    case FALLBACK_EXPLORER_SET_HANDLERS:
      return {
        ...state,
        fallbackExplorerAssetsHandle:
          action.payload.fallbackExplorerAssetsHandle,
        fallbackExplorerBalancesHandle:
          action.payload.fallbackExplorerBalancesHandle,
      };
    case FALLBACK_EXPLORER_SET_BALANCE_HANDLER:
      return {
        ...state,
        fallbackExplorerBalancesHandle:
          action.payload.fallbackExplorerBalancesHandle,
      };
    default:
      return state;
  }
};
