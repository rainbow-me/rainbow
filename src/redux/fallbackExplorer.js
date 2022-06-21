import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import { get, isEmpty, keyBy, map, mapValues, toLower, uniqBy } from 'lodash';
import isEqual from 'react-fast-compare';
import { ETHERSCAN_API_KEY } from 'react-native-dotenv';
import { addressAssetsReceived, fetchAssetPricesWithCoingecko } from './data';
// eslint-disable-next-line import/no-cycle
import { emitMainnetAssetDiscoveryRequest, explorerInitL2 } from './explorer';
import { AssetTypes } from '@rainbow-me/entities';
import { getAssetsFromCovalent } from '@rainbow-me/handlers/covalent';
import { web3Provider } from '@rainbow-me/handlers/web3';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import NetworkTypes from '@rainbow-me/helpers/networkTypes';
import {
  balanceCheckerContractAbi,
  chainAssets,
  COVALENT_ETH_ADDRESS,
  ETH_ADDRESS,
  ETH_COINGECKO_ID,
  migratedTokens,
} from '@rainbow-me/references';
import { delay } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

let lastUpdatePayload = null;
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

// Some contracts like SNX / SUSD use an ERC20 proxy
// some of those tokens have been migrated to a new address
// We need to use the current address to fetch the correct price
const getCurrentAddress = address => {
  return migratedTokens[address] || address;
};

const findNewAssetsToWatch = () => async (dispatch, getState) => {
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
        mainnetAssets: newMainnetAssets,
      },
      type: FALLBACK_EXPLORER_SET_ASSETS,
    });
  }
};

const getPrice = (contractAddress, updatedAt, genericAssets, quoteRate) => {
  const isETH =
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
    value: 0,
    ...price,
  };
};

const getMainnetAssetsFromCovalent = async (
  chainId,
  accountAddress,
  type,
  currency,
  coingeckoIds,
  genericAssets
) => {
  const data = await getAssetsFromCovalent(chainId, accountAddress, currency);
  if (data) {
    const updatedAt = new Date(data.updated_at).getTime();
    const assets = data.items.map(item => {
      let contractAddress = item.contract_address;
      const isETH = toLower(contractAddress) === toLower(COVALENT_ETH_ADDRESS);
      if (isETH) {
        contractAddress = ETH_ADDRESS;
      }

      const coingeckoId = coingeckoIds[toLower(contractAddress)];

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

const findAssetsToWatch = async (
  address,
  latestTxBlockNumber,
  dispatch,
  coingeckoIds
) => {
  // 1 - Discover the list of tokens for the address
  const tokensInWallet = await discoverTokens(
    coingeckoIds,
    address,
    latestTxBlockNumber,
    dispatch
  );
  if (latestTxBlockNumber && tokensInWallet.length === 0) {
    return [];
  }

  const tokens = [
    ...tokensInWallet,
    {
      asset: {
        asset_code: ETH_ADDRESS,
        coingecko_id: ETH_COINGECKO_ID,
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
    },
  ];
  return keyBy(tokens, 'asset.asset_code');
};

const getTokenType = tx => {
  if (tx.tokenSymbol === 'UNI-V1') return AssetTypes.uniswap;
  if (tx.tokenSymbol === 'UNI-V2') return AssetTypes.uniswapV2;
  if (
    toLower(tx.tokenName).indexOf('compound') !== -1 &&
    tx.tokenSymbol !== 'COMP'
  )
    return AssetTypes.compound;
  return undefined;
};

const discoverTokens = async (
  coingeckoIds,
  address,
  latestTxBlockNumber,
  dispatch
) => {
  let page = 1;
  const offset = 1000;
  let allTxs = [];
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

const getTokenTxDataFromEtherscan = async (
  address,
  page,
  offset,
  latestTxBlockNumber
) => {
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

const fetchAssetBalances = async (tokens, address, network) => {
  const balanceCheckerContract = new Contract(
    get(networkInfo[network], 'balance_checker_contract_address'),
    balanceCheckerContractAbi,
    web3Provider
  );
  try {
    const values = await balanceCheckerContract.balances([address], tokens);
    const balances = {};
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

const assetDiscoveryCallbackQueue = {};

export const onMainnetAssetDiscoveryResponse = response => {
  const queueKey =
    response?.meta?.address?.toLowerCase() +
    response?.meta?.currency?.toLowerCase();
  const callbacks = assetDiscoveryCallbackQueue[queueKey];
  if (!callbacks) {
    return;
  }
  assetDiscoveryCallbackQueue[queueKey] = undefined;
  for (let callback of callbacks) {
    callback(response.payload.assets);
  }
};

export const fetchOnchainBalances = ({
  keepPolling = true,
  withPrices = true,
}) => async (dispatch, getState) => {
  logger.log('😬 FallbackExplorer:: fetchOnchainBalances');
  const { network, accountAddress, nativeCurrency } = getState().settings;
  const { accountAssetsData, genericAssets } = getState().data;
  const { coingeckoIds } = getState().additionalAssetsData;
  const formattedNativeCurrency = toLower(nativeCurrency);
  const { mainnetAssets } = getState().fallbackExplorer;
  const callback = async covalentMainnetAssets => {
    const chainAssetsMap = keyBy(chainAssets[network], 'asset.asset_code');

    let assets =
      network === NetworkTypes.mainnet
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
      }));
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

    const tokenAddresses = map(assets, ({ asset: { asset_code } }) =>
      asset_code === ETH_ADDRESS
        ? ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT
        : toLower(asset_code)
    );

    const balances = await fetchAssetBalances(
      tokenAddresses,
      accountAddress,
      network
    );

    let updatedAssets = assets;
    if (balances) {
      updatedAssets = mapValues(assets, assetAndQuantity => {
        const assetCode = toLower(assetAndQuantity.asset.asset_code);
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
      });
    }

    if (withPrices) {
      const coingeckoIds = map(
        updatedAssets,
        ({ asset: { coingecko_id } }) => coingecko_id
      );
      const prices = await fetchAssetPricesWithCoingecko(
        coingeckoIds,
        formattedNativeCurrency
      );

      if (prices) {
        updatedAssets = mapValues(updatedAssets, asset => {
          const assetCoingeckoId = toLower(asset.asset.coingecko_id);
          if (prices[assetCoingeckoId]) {
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
        });
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
              status: 'ok',
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
      if (NetworkTypes.mainnet === network) {
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

  if (network === NetworkTypes.mainnet) {
    const receiveCovalentResponse = assets => {
      // Fix prices
      const parsedAssets = {};
      for (let [key, asset] of Object.entries(assets)) {
        parsedAssets[key] = {
          ...asset,
          asset: {
            ...asset.asset,
            price: getPrice(
              asset.asset.asset_code,
              asset.asset.price?.updatedAt,
              genericAssets,
              asset.asset.price?.value
            ),
          },
        };
      }

      callback(parsedAssets);
    };

    dispatch(emitMainnetAssetDiscoveryRequest);
    const queueKey =
      accountAddress.toLowerCase() + nativeCurrency.toLowerCase();
    assetDiscoveryCallbackQueue[queueKey] =
      assetDiscoveryCallbackQueue[queueKey] ?? [];
    assetDiscoveryCallbackQueue[queueKey].push(receiveCovalentResponse);
  } else {
    const chainId = ethereumUtils.getChainIdFromNetwork(network);
    const covalentMainnetAssets = await getMainnetAssetsFromCovalent(
      chainId,
      accountAddress,
      AssetTypes.token,
      formattedNativeCurrency,
      coingeckoIds,
      genericAssets
    );
    callback(covalentMainnetAssets);
  }
};

export const fallbackExplorerInit = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { latestTxBlockNumber, mainnetAssets } = getState().fallbackExplorer;
  const { coingeckoIds } = getState().additionalAssetsData;
  // If mainnet, we need to get all the info
  // 1 - Coingecko ids
  // 2 - All tokens list
  // 3 - Etherscan token transfer transactions
  if (NetworkTypes.mainnet === network) {
    const newMainnetAssets = await findAssetsToWatch(
      accountAddress,
      latestTxBlockNumber,
      dispatch,
      coingeckoIds
    );

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

export const fallbackExplorerClearState = () => (dispatch, getState) => {
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
const INITIAL_STATE = {
  fallbackExplorerAssetsHandle: null,
  fallbackExplorerBalancesHandle: null,
  latestTxBlockNumber: null,
  mainnetAssets: {},
};

export default (state = INITIAL_STATE, action) => {
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
