import { Contract } from '@ethersproject/contracts';
import { get, toLower, uniqBy } from 'lodash';
import isEqual from 'react-fast-compare';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { ETHERSCAN_API_KEY } from 'react-native-dotenv';
// eslint-disable-next-line import/no-cycle
import { addressAssetsReceived, fetchAssetPricesWithCoingecko } from './data';
// eslint-disable-next-line import/no-cycle
import { explorerInitL2 } from './explorer';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { AssetTypes } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/covalent'... Remove this comment to see the full error message
import { getAssetsFromCovalent } from '@rainbow-me/handlers/covalent';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { web3Provider } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkInf... Remove this comment to see the full error message
import networkInfo from '@rainbow-me/helpers/networkInfo';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import NetworkTypes from '@rainbow-me/helpers/networkTypes';
import {
  balanceCheckerContractAbi,
  chainAssets,
  COVALENT_ETH_ADDRESS,
  ETH_ADDRESS,
  ETH_COINGECKO_ID,
  migratedTokens,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
} from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { delay } from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

let lastUpdatePayload: any = null;
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
const getCurrentAddress = (address: any) => {
  return migratedTokens[address] || address;
};

const getMainnetAssetsFromCovalent = async (
  chainId: any,
  accountAddress: any,
  type: any,
  currency: any,
  coingeckoIds: any,
  allAssets: any,
  genericAssets: any
) => {
  const data = await getAssetsFromCovalent(chainId, accountAddress, currency);
  if (data) {
    const updatedAt = new Date(data.updated_at).getTime();
    const assets = data.items.map((item: any) => {
      let contractAddress = item.contract_address;
      if (toLower(contractAddress) === toLower(COVALENT_ETH_ADDRESS)) {
        contractAddress = ETH_ADDRESS;
      }

      const coingeckoId = coingeckoIds[toLower(contractAddress)];
      let price = {
        changed_at: updatedAt,
        relative_change_24h: 0,
      };

      // Overrides
      const fallbackAsset =
        ethereumUtils.getAsset(allAssets, toLower(contractAddress)) ||
        genericAssets[toLower(contractAddress)];

      if (fallbackAsset) {
        price = {
          ...price,
          ...fallbackAsset.price,
        };
      }

      return {
        asset: {
          asset_code: contractAddress,
          coingecko_id: coingeckoId,
          decimals: item.contract_decimals,
          icon_url: item.logo_url,
          name: item.contract_name,
          price: {
            value: 0,
            ...price,
          },
          symbol: item.contract_ticker_symbol,
          type,
        },
        quantity: item.balance,
      };
    });

    return assets;
  }
  return null;
};

const findNewAssetsToWatch = () => async (dispatch: any, getState: any) => {
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
    const newMainnetAssets = uniqBy(
      [...mainnetAssets, ...newAssets],
      token => token.asset.asset_code
    );

    dispatch({
      payload: {
        mainnetAssets: newMainnetAssets,
      },
      type: FALLBACK_EXPLORER_SET_ASSETS,
    });
  }
};

const findAssetsToWatch = async (
  address: any,
  latestTxBlockNumber: any,
  dispatch: any,
  coingeckoIds: any
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

  return [
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
};

const getTokenType = (tx: any) => {
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
  coingeckoIds: any,
  address: any,
  latestTxBlockNumber: any,
  dispatch: any
) => {
  let page = 1;
  const offset = 1000;
  let allTxs: any = [];
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
      // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'tx' implicitly has an 'any' type.
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
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      token => token.asset.asset_code
    );
  }
  return [];
};

const getTokenTxDataFromEtherscan = async (
  address: any,
  page: any,
  offset: any,
  latestTxBlockNumber: any
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

const fetchAssetBalances = async (tokens: any, address: any, network: any) => {
  const balanceCheckerContract = new Contract(
    get(networkInfo[network], 'balance_checker_contract_address'),
    balanceCheckerContractAbi,
    web3Provider
  );
  try {
    const values = await balanceCheckerContract.balances([address], tokens);
    const balances = {};
    [address].forEach((addr, addrIdx) => {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      balances[addr] = {};
      tokens.forEach((tokenAddr: any, tokenIdx: any) => {
        const balance = values[addrIdx * tokens.length + tokenIdx];
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        balances[addr][tokenAddr] = balance.toString();
      });
    });
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    return balances[address];
  } catch (e) {
    logger.log(
      'Error fetching balances from balanceCheckerContract',
      network,
      e
    );
    return null;
  }
};

export const fetchOnchainBalances = ({
  keepPolling = true,
  withPrices = true,
}) => async (dispatch: any, getState: any) => {
  logger.log('😬 FallbackExplorer:: fetchOnchainBalances');
  const { network, accountAddress, nativeCurrency } = getState().settings;
  const { assets: allAssets, genericAssets } = getState().data;
  const { coingeckoIds } = getState().additionalAssetsData;
  const formattedNativeCurrency = toLower(nativeCurrency);
  const { mainnetAssets } = getState().fallbackExplorer;
  const chainId = ethereumUtils.getChainIdFromNetwork(network);
  const covalentMainnetAssets = await getMainnetAssetsFromCovalent(
    chainId,
    accountAddress,
    AssetTypes.token,
    formattedNativeCurrency,
    coingeckoIds,
    allAssets,
    genericAssets
  );

  const { assets: accountAssets } = getState().data;
  let assets =
    network === NetworkTypes.mainnet
      ? covalentMainnetAssets
        ? uniqBy(
            [...mainnetAssets, ...covalentMainnetAssets],
            token => token.asset.asset_code
          )
        : mainnetAssets
      : chainAssets[network];

  if (!assets.length && accountAssets.length) {
    assets = accountAssets.map((asset: any) => ({
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

  if (!assets || (!assets.length && keepPolling)) {
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

  const tokenAddresses = assets.map(({ asset: { asset_code } }: any) =>
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
    updatedAssets = assets.map((assetAndQuantity: any) => {
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
    const prices = await fetchAssetPricesWithCoingecko(
      updatedAssets.map(({ asset: { coingecko_id } }: any) => coingecko_id),
      formattedNativeCurrency
    );

    if (prices) {
      Object.keys(prices).forEach(key => {
        for (let i = 0; i < updatedAssets.length; i++) {
          if (toLower(updatedAssets[i].asset.coingecko_id) === toLower(key)) {
            updatedAssets[i].asset.price = {
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
  }

  logger.log('😬 FallbackExplorer updating assets');

  const newPayload = { assets: updatedAssets };

  if (!keepPolling || !isEqual(lastUpdatePayload, newPayload)) {
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

export const fallbackExplorerInit = () => async (
  dispatch: any,
  getState: any
) => {
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
        mainnetAssets: uniqBy(
          [...mainnetAssets, ...newMainnetAssets],
          token => token.asset.asset_code
        ),
      },
      type: FALLBACK_EXPLORER_SET_ASSETS,
    });
  }

  dispatch(fetchOnchainBalances({ keepPolling: true, withPrices: true }));
  dispatch(explorerInitL2());
};

export const fallbackExplorerClearState = () => (
  dispatch: any,
  getState: any
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
const INITIAL_STATE = {
  fallbackExplorerAssetsHandle: null,
  fallbackExplorerBalancesHandle: null,
  latestTxBlockNumber: null,
  mainnetAssets: [],
};

export default (state = INITIAL_STATE, action: any) => {
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
