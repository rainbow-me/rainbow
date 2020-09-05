import { ethers } from 'ethers';
import { get, toLower, uniqBy } from 'lodash';
import { web3Provider } from '../handlers/web3';
import networkInfo from '../helpers/networkInfo';
import networkTypes from '../helpers/networkTypes';
import { delay } from '../helpers/utilities';
import balanceCheckerContractAbi from '../references/balances-checker-abi.json';
import allTokensFallback from '../references/coingecko/allTokens.json';
import coingeckoIdsFallback from '../references/coingecko/ids.json';
import migratedTokens from '../references/migratedTokens.json';
import testnetAssets from '../references/testnet-assets.json';
import { addressAssetsReceived } from './data';
import logger from 'logger';

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
const TOKEN_LIST_URL = 'https://tokens.coingecko.com/uniswap/all.json';
const COINGECKO_IDS_ENDPOINT = 'https://api.coingecko.com/api/v3/coins/list';
const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 10000;
const DISCOVER_NEW_ASSETS_FREQUENCY = 13000;
let fallbackExplorerBalancesHandle = null;
let fallbackExplorerAssetsHandle = null;
let mainnetAssets = null;
let latestTxBlockNumber = null;

// Some contracts like SNX / SUSD use an ERC20 proxy
// some of those tokens have been migrated to a new address
// We need to use the current address to fetch the correct price
const getCurrentAddress = address => {
  return migratedTokens[address] || address;
};

// Required to attempt to fix most inconsistencies between
// Coingecko's API and coingecko's token
const cleanupTokenName = str =>
  str
    .replace(' ', '')
    .replace('.', '')
    .toLowerCase();

const findNewAssetsToWatch = async address => {
  const newAssets = await findAssetsToWatch(address);
  if (newAssets.length > 0) {
    logger.log('💀 Found new assets!', newAssets);

    // dedupe
    mainnetAssets = uniqBy(
      [...mainnetAssets, ...newAssets],
      token => token.asset.asset_code
    );
  }
};

const fetchCoingeckoIds = async () => {
  try {
    let ids;
    try {
      const request = await fetch(COINGECKO_IDS_ENDPOINT);
      ids = await request.json();
    } catch (e) {
      ids = coingeckoIdsFallback;
    }

    const idsMap = {};
    ids.forEach(({ name, symbol, id }) => {
      idsMap[`${symbol.toLowerCase()}|||${cleanupTokenName(name)}`] = id;
    });
    return idsMap;
  } catch (e) {
    logger.log('error fetching tokenlist', TOKEN_LIST_URL, e);
  }
};

export const fetchCoingeckoIdsByAddress = async () => {
  try {
    let tokens;
    try {
      const response = await fetch(TOKEN_LIST_URL);
      const responseData = await response.json();
      tokens = responseData.tokens;
    } catch (e) {
      tokens = allTokensFallback.tokens;
    }

    const idsByAddress = {};
    const coingeckoIds = await fetchCoingeckoIds();

    tokens.forEach(token => {
      idsByAddress[token.address.toLowerCase()] =
        coingeckoIds[
          `${token.symbol.toLowerCase()}|||${cleanupTokenName(token.name)}`
        ];
    });
    return idsByAddress;
  } catch (e) {
    logger.log('error fetching tokenlist', TOKEN_LIST_URL, e);
  }
};

const findAssetsToWatch = async address => {
  // 1 - Discover the list of tokens for the address
  const coingeckoIds = await fetchCoingeckoIdsByAddress();
  const tokensInWallet = await discoverTokens(coingeckoIds, address);
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

const discoverTokens = async (coingeckoIds, address) => {
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
    latestTxBlockNumber = Number(allTxs[0].blockNumber) + 1;

    return uniqBy(
      allTxs.map(tx => ({
        asset: {
          asset_code: getCurrentAddress(tx.contractAddress.toLowerCase()),
          coingecko_id: coingeckoIds[tx.contractAddress.toLowerCase()],
          decimals: tx.tokenDecimal,
          name: tx.tokenName,
          symbol: tx.tokenSymbol,
        },
      })),
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
  const balanceCheckerContract = new ethers.Contract(
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
        balances[addr][tokenAddr] = balance;
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
  const formattedNativeCurrency = toLower(nativeCurrency);
  // If mainnet, we need to get all the info
  // 1 - Coingecko ids
  // 2 - All tokens list
  // 3 - Etherscan token transfer transactions
  if (networkTypes.mainnet === network) {
    mainnetAssets = await findAssetsToWatch(accountAddress);
  }

  const fetchAssetsBalancesAndPrices = async () => {
    logger.log('💀 FallbackExplorer fetchAssetsBalancesAndPrices');
    const { network } = getState().settings;
    const assets =
      network === networkTypes.mainnet ? mainnetAssets : testnetAssets[network];
    if (!assets || !assets.length) {
      fallbackExplorerBalancesHandle = setTimeout(
        fetchAssetsBalancesAndPrices,
        10000
      );
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

    let total = ethers.utils.bigNumberify(0);

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

    logger.log('💀 FallbackExplorer updating assets');

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
    fallbackExplorerBalancesHandle = setTimeout(
      fetchAssetsBalancesAndPrices,
      UPDATE_BALANCE_AND_PRICE_FREQUENCY
    );
    if (networkTypes.mainnet === network) {
      fallbackExplorerAssetsHandle = setTimeout(
        () => findNewAssetsToWatch(accountAddress),
        DISCOVER_NEW_ASSETS_FREQUENCY
      );
    }
  };
  fetchAssetsBalancesAndPrices();
};

export const fallbackExplorerClearState = () => {
  clearTimeout(fallbackExplorerBalancesHandle);
  clearTimeout(fallbackExplorerAssetsHandle);
  latestTxBlockNumber = null;
  mainnetAssets = null;
};
