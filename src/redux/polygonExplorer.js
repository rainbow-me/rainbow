import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { toLower } from 'lodash';
import isEqual from 'react-fast-compare';
import {
  COVALENT_ANDROID_API_KEY,
  COVALENT_IOS_API_KEY,
} from 'react-native-dotenv';
// eslint-disable-next-line import/no-cycle
import { addressAssetsReceived, fetchAssetPricesWithCoingecko } from './data';
// eslint-disable-next-line import/no-cycle
import { emitAssetRequest, emitChartsRequest } from './explorer';
import { AssetTypes } from '@rainbow-me/entities';
//import networkInfo from '@rainbow-me/helpers/networkInfo';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  balanceCheckerContractAbi,
  chainAssets,
  MATIC_MAINNET_ADDRESS,
  MATIC_POLYGON_ADDRESS,
  WETH_ADDRESS,
} from '@rainbow-me/references';

import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

let lastUpdatePayload = null;
// -- Constants --------------------------------------- //
const POLYGON_EXPLORER_CLEAR_STATE = 'explorer/POLYGON_EXPLORER_CLEAR_STATE';
const POLYGON_EXPLORER_SET_BALANCE_HANDLER =
  'explorer/POLYGON_EXPLORER_SET_BALANCE_HANDLER';
const POLYGON_EXPLORER_SET_HANDLERS = 'explorer/POLYGON_EXPLORER_SET_HANDLERS';

const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 60000;
const network = networkTypes.polygon;
let tokenMapping = {};

const fetchAssetsMapping = async () => {
  const fetchPage = async page => {
    try {
      const limit = 200;
      const url = `https://tokenmapper.api.matic.today/api/v1/mapping?map_type=[%22POS%22]&chain_id=137&limit=${limit}&offset=${
        limit * page
      }`;
      const request = await fetch(url);
      const response = await request.json();
      if (response.message === 'success') {
        return response.data;
      }
      return null;
    } catch (e) {
      logger.log(`Error trying to fetch polygon token map`, e);
      return null;
    }
  };

  let next = true;
  let page = 0;
  let fullMapping = [];
  while (next) {
    const pageData = await fetchPage(page);
    next = pageData.has_next_page;
    fullMapping = fullMapping.concat(pageData.mapping);
    if (next) {
      page++;
    }
  }

  const mapping = {};
  fullMapping.forEach(mappingData => {
    mapping[`${toLower(mappingData.child_token)}`] = mappingData.root_token;
  });
  return mapping;
};

const getAssetsFromCovalent = async (
  chainId,
  address,
  type,
  currency,
  coingeckoIds,
  allAssets,
  genericAssets
) => {
  const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?nft=false&quote-currency=${currency}&key=${
    ios ? COVALENT_IOS_API_KEY : COVALENT_ANDROID_API_KEY
  }`;
  const request = await fetch(url);
  const response = await request.json();
  if (response.data && !response.error) {
    const updatedAt = new Date(response.data.update_at).getTime();
    const assets = response.data.items.map(item => {
      let mainnetAddress = tokenMapping[toLower(item.contract_address)];
      let coingeckoId = coingeckoIds[toLower(mainnetAddress)];
      let price = {
        changed_at: updatedAt,
        relative_change_24h: 0,
      };

      // Overrides
      if (
        toLower(mainnetAddress) ===
        toLower('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
      ) {
        mainnetAddress = WETH_ADDRESS;
        coingeckoId = 'ethereum';
      } else if (
        toLower(item.contract_address) === toLower(MATIC_POLYGON_ADDRESS)
      ) {
        mainnetAddress = MATIC_MAINNET_ADDRESS;
        coingeckoId = 'matic-network';
      }

      const fallbackAsset =
        ethereumUtils.getAsset(allAssets, toLower(mainnetAddress)) ||
        genericAssets[toLower(mainnetAddress)];

      if (fallbackAsset) {
        price = {
          ...price,
          ...fallbackAsset.price,
        };
      }

      return {
        asset: {
          asset_code: item.contract_address,
          coingecko_id: coingeckoId,
          decimals: item.contract_decimals,
          icon_url: item.logo_url,
          mainnet_address: mainnetAddress,
          name: item.contract_name.replace(' (PoS)', ''),
          network: networkTypes.polygon,
          price: {
            value: item.quote_rate || 0,
            ...price,
          },
          symbol: item.contract_ticker_symbol,
          type,
        },
        quantity: Number(item.balance),
      };
    });

    return assets;
  }
  return null;
};

const fetchAssetBalances = async (tokens, address) => {
  const abi = balanceCheckerContractAbi;

  const contractAddress = networkInfo[network].balance_checker_contract_address;
  const polygonProvider = await getProviderForNetwork(network);

  const balanceCheckerContract = new Contract(
    contractAddress,
    abi,
    polygonProvider
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

export const polygonExplorerInit = () => async (dispatch, getState) => {
  if (networkInfo[networkTypes.polygon]?.disabled) return;
  const { accountAddress, nativeCurrency } = getState().settings;
  const { assets: allAssets, genericAssets } = getState().data;
  const { coingeckoIds } = getState().additionalAssetsData;
  const formattedNativeCurrency = toLower(nativeCurrency);
  tokenMapping = await fetchAssetsMapping();

  const fetchAssetsBalancesAndPricesFallback = async () => {
    const assets = chainAssets[network];
    const tokenAddresses = assets.map(
      ({ asset: { asset_code } }) => asset_code
    );

    dispatch(emitAssetRequest(tokenAddresses));
    dispatch(emitChartsRequest(tokenAddresses));

    const prices = await fetchAssetPricesWithCoingecko(
      assets.map(({ asset: { coingecko_id } }) => coingecko_id),
      formattedNativeCurrency
    );

    if (prices) {
      Object.keys(prices).forEach(key => {
        for (let i = 0; i < assets.length; i++) {
          if (toLower(assets[i].asset.coingecko_id) === toLower(key)) {
            const asset =
              ethereumUtils.getAsset(
                allAssets,
                toLower(assets[i].asset.mainnet_address)
              ) || genericAssets[toLower(assets[i].asset.mainnet_address)];
            assets[i].asset.network = networkTypes.polygon;
            assets[i].asset.price = asset?.price || {
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
      assets.map(({ asset: { asset_code } }) => asset_code),
      accountAddress,
      network
    );

    let total = BigNumber.from(0);

    if (balances) {
      Object.keys(balances).forEach(key => {
        for (let i = 0; i < assets.length; i++) {
          if (assets[i].asset.asset_code.toLowerCase() === key.toLowerCase()) {
            assets[i].quantity = balances[key];
            break;
          }
        }
        total = total.add(balances[key]);
      });
    }

    dispatch(
      addressAssetsReceived(
        {
          meta: {
            address: accountAddress,
            currency: nativeCurrency,
            status: 'ok',
          },
          payload: { assets },
        },
        false,
        false,
        false,
        networkTypes.polygon
      )
    );
  };

  const fetchAssetsBalancesAndPrices = async () => {
    const chainId = ethereumUtils.getChainIdFromNetwork(network);
    const assets = await getAssetsFromCovalent(
      chainId,
      accountAddress,
      AssetTypes.polygon,
      formattedNativeCurrency,
      coingeckoIds,
      allAssets,
      genericAssets
    );

    if (assets === null) {
      fetchAssetsBalancesAndPricesFallback();
      return;
    }

    if (!assets || !assets.length) {
      // Try again in one minute
      const polygonExplorerBalancesHandle = setTimeout(
        fetchAssetsBalancesAndPrices,
        UPDATE_BALANCE_AND_PRICE_FREQUENCY * 2
      );
      dispatch({
        payload: {
          polygonExplorerBalancesHandle,
        },
        type: POLYGON_EXPLORER_SET_BALANCE_HANDLER,
      });
      return;
    }

    const tokenAddresses = assets.map(
      ({ asset: { asset_code } }) => asset_code
    );

    dispatch(emitAssetRequest(tokenAddresses));
    dispatch(emitChartsRequest(tokenAddresses));

    const prices = await fetchAssetPricesWithCoingecko(
      assets.map(({ asset: { coingecko_id } }) => coingecko_id),
      formattedNativeCurrency
    );

    if (prices) {
      Object.keys(prices).forEach(key => {
        for (let i = 0; i < assets.length; i++) {
          if (toLower(assets[i].asset.coingecko_id) === toLower(key)) {
            if (!assets[i].asset.price.relative_change_24h) {
              assets[i].asset.price.relative_change_24h =
                prices[key][`${formattedNativeCurrency}_24h_change`];
            }
            break;
          }
        }
      });
    }

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
          networkTypes.polygon
        )
      );
      lastUpdatePayload = newPayload;
    }

    const polygonExplorerBalancesHandle = setTimeout(
      fetchAssetsBalancesAndPrices,
      UPDATE_BALANCE_AND_PRICE_FREQUENCY
    );
    let polygonExplorerAssetsHandle = null;

    dispatch({
      payload: {
        polygonExplorerAssetsHandle,
        polygonExplorerBalancesHandle,
      },
      type: POLYGON_EXPLORER_SET_HANDLERS,
    });
  };
  fetchAssetsBalancesAndPrices();
};

export const polygonExplorerClearState = () => (dispatch, getState) => {
  const {
    polygonExplorerBalancesHandle,
    polygonExplorerAssetsHandle,
  } = getState().polygonExplorer;

  polygonExplorerBalancesHandle && clearTimeout(polygonExplorerBalancesHandle);
  polygonExplorerAssetsHandle && clearTimeout(polygonExplorerAssetsHandle);
  dispatch({ type: POLYGON_EXPLORER_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  polygonExplorerAssetsHandle: null,
  polygonExplorerBalancesHandle: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case POLYGON_EXPLORER_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    case POLYGON_EXPLORER_SET_HANDLERS:
      return {
        ...state,
        polygonExplorerAssetsHandle: action.payload.polygonExplorerAssetsHandle,
        polygonExplorerBalancesHandle:
          action.payload.polygonExplorerBalancesHandle,
      };
    case POLYGON_EXPLORER_SET_BALANCE_HANDLER:
      return {
        ...state,
        polygonExplorerBalancesHandle:
          action.payload.polygonExplorerBalancesHandle,
      };
    default:
      return state;
  }
};
