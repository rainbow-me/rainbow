import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { get, toLower, uniqBy } from 'lodash';
import isEqual from 'react-fast-compare';
/* eslint-disable-next-line import/no-cycle */
import { arbitrumExplorerInit } from './arbitrumExplorer';
// eslint-disable-next-line import/no-cycle
import { addressAssetsReceived, fetchAssetPricesWithCoingecko } from './data';
// eslint-disable-next-line import/no-cycle
import { optimismExplorerInit } from './optimismExplorer';
// eslint-disable-next-line import/no-cycle
import { polygonExplorerInit } from './polygonExplorer';
import { AssetTypes } from '@rainbow-me/entities';
import { web3Provider } from '@rainbow-me/handlers/web3';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import NetworkTypes from '@rainbow-me/helpers/networkTypes';
import {
  balanceCheckerContractAbi,
  chainAssets,
  ETH_ADDRESS,
  ETH_COINGECKO_ID,
  migratedTokens,
} from '@rainbow-me/references';
import { delay } from '@rainbow-me/utilities';
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

  const newAssets = await findAssetsToWatch(
    accountAddress,
    latestTxBlockNumber,
    dispatch
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
  let url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=${page}&offset=${offset}&sort=desc`;
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
    logger.log(
      'Error fetching balances from balanceCheckerContract',
      network,
      e
    );
    return null;
  }
};

export const fallbackExplorerInit = () => async (dispatch, getState) => {
  const { accountAddress, nativeCurrency, network } = getState().settings;
  const { latestTxBlockNumber, mainnetAssets } = getState().fallbackExplorer;
  const formattedNativeCurrency = toLower(nativeCurrency);
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
        mainnetAssets: mainnetAssets.concat(newMainnetAssets),
      },
      type: FALLBACK_EXPLORER_SET_ASSETS,
    });
  }

  const fetchAssetsBalancesAndPrices = async () => {
    logger.log('😬 FallbackExplorer fetchAssetsBalancesAndPrices');
    const { network } = getState().settings;
    const { mainnetAssets } = getState().fallbackExplorer;
    const assets =
      network === NetworkTypes.mainnet ? mainnetAssets : chainAssets[network];
    if (!assets || !assets.length) {
      const fallbackExplorerBalancesHandle = setTimeout(
        fetchAssetsBalancesAndPrices,
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

    const prices = await fetchAssetPricesWithCoingecko(
      assets.map(({ asset: { coingecko_id } }) => coingecko_id),
      formattedNativeCurrency
    );

    if (prices) {
      Object.keys(prices).forEach(key => {
        for (let i = 0; i < assets.length; i++) {
          if (toLower(assets[i].asset.coingecko_id) === toLower(key)) {
            assets[i].asset.price = {
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
    const balances = await fetchAssetBalances(
      assets.map(({ asset: { asset_code } }) =>
        asset_code === ETH_ADDRESS
          ? ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT
          : asset_code
      ),
      accountAddress,
      network
    );

    let total = BigNumber.from(0);

    if (balances) {
      Object.keys(balances).forEach(key => {
        for (let i = 0; i < assets.length; i++) {
          if (
            assets[i].asset.asset_code.toLowerCase() === key.toLowerCase() ||
            (assets[i].asset.asset_code === ETH_ADDRESS &&
              key === ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT)
          ) {
            assets[i].quantity = balances[key];
            break;
          }
        }
        total = total.add(balances[key]);
      });
    }

    logger.log('😬 FallbackExplorer updating assets');

    const newPayload = { assets };

    if (!isEqual(lastUpdatePayload, newPayload)) {
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

    const fallbackExplorerBalancesHandle = setTimeout(
      fetchAssetsBalancesAndPrices,
      UPDATE_BALANCE_AND_PRICE_FREQUENCY
    );
    let fallbackExplorerAssetsHandle = null;
    if (NetworkTypes.mainnet === network) {
      fallbackExplorerAssetsHandle = setTimeout(
        () => dispatch(findNewAssetsToWatch(accountAddress)),
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
  };
  fetchAssetsBalancesAndPrices();
  if (network === NetworkTypes.mainnet) {
    // Start watching arbitrum assets
    dispatch(arbitrumExplorerInit());
    // Start watching optimism assets
    dispatch(optimismExplorerInit());
    // Start watching polygon assets
    dispatch(polygonExplorerInit());
  }
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
  mainnetAssets: [],
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
