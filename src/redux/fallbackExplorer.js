import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { get, toLower, uniqBy } from 'lodash';
import { web3Provider } from '../handlers/web3';
import networkInfo from '../helpers/networkInfo';
import networkTypes from '../helpers/networkTypes';
import { delay } from '../helpers/utilities';
import balanceCheckerContractAbi from '../references/balances-checker-abi.json';
import coingeckoIdsFallback from '../references/coingecko/ids.json';
import migratedTokens from '../references/migratedTokens.json';
import testnetAssets from '../references/testnet-assets.json';
import { addressAssetsReceived } from './data';
import logger from 'logger';

// -- Constants --------------------------------------- //
const FALLBACK_EXPLORER_CLEAR_STATE = 'explorer/FALLBACK_EXPLORER_CLEAR_STATE';
const FALLBACK_EXPLORER_SET_ASSETS = 'explorer/FALLBACK_EXPLORER_SET_ASSETS';
const FALLBACK_EXPLORER_SET_BALANCE_HANDLER =
  'explorer/FALLBACK_EXPLORER_SET_BALANCE_HANDLER';
const FALLBACK_EXPLORER_SET_HANDLERS =
  'explorer/FALLBACK_EXPLORER_SET_HANDLERS';
const FALLBACK_EXPLORER_SET_LATEST_TX_BLOCK_NUMBER =
  'explorer/FALLBACK_EXPLORER_SET_LATEST_TX_BLOCK_NUMBER';

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
const COINGECKO_IDS_ENDPOINT =
  'https://api.coingecko.com/api/v3/coins/list?include_platform=true&asset_platform_id=ethereum';
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

const fetchCoingeckoIds = async () => {
  let ids;
  try {
    const request = await fetch(COINGECKO_IDS_ENDPOINT);
    ids = await request.json();
  } catch (e) {
    ids = coingeckoIdsFallback;
  }

  const idsMap = {};
  ids.forEach(({ id, platforms: { ethereum: tokenAddress } }) => {
    const address = tokenAddress && toLower(tokenAddress);
    if (address && address.substr(0, 2) === '0x') {
      idsMap[address] = id;
    }
  });
  return idsMap;
};

const findAssetsToWatch = async (address, latestTxBlockNumber, dispatch) => {
  // 1 - Discover the list of tokens for the address
  const coingeckoIds = await fetchCoingeckoIds();
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
        asset_code: 'eth',
        coingecko_id: 'ethereum',
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
    },
  ];
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
        const type =
          tx.tokenSymbol === 'UNI-V1'
            ? 'uniswap'
            : tx.tokenSymbol === 'UNI-V2'
            ? 'uniswap-v2'
            : undefined;
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

const fetchAssetPrices = async (coingeckoIds, nativeCurrency) => {
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
  // If mainnet, we need to get all the info
  // 1 - Coingecko ids
  // 2 - All tokens list
  // 3 - Etherscan token transfer transactions
  if (networkTypes.mainnet === network) {
    const newMainnetAssets = await findAssetsToWatch(
      accountAddress,
      latestTxBlockNumber,
      dispatch
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
      network === networkTypes.mainnet ? mainnetAssets : testnetAssets[network];
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

    const prices = await fetchAssetPrices(
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
        asset_code === 'eth' ? ETH_ADDRESS : asset_code
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
            (assets[i].asset.asset_code === 'eth' && key === ETH_ADDRESS)
          ) {
            assets[i].quantity = balances[key];
            break;
          }
        }
        total = total.add(balances[key]);
      });
    }

    logger.log('😬 FallbackExplorer updating assets');

    dispatch(
      addressAssetsReceived({
        meta: {
          address: accountAddress,
          currency: 'usd',
          status: 'ok',
        },
        payload: { assets },
      })
    );
    const fallbackExplorerBalancesHandle = setTimeout(
      fetchAssetsBalancesAndPrices,
      UPDATE_BALANCE_AND_PRICE_FREQUENCY
    );
    let fallbackExplorerAssetsHandle = null;
    if (networkTypes.mainnet === network) {
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
