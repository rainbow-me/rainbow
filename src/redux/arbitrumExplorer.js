import { toLower } from 'lodash';
import {
  COVALENT_ANDROID_API_KEY,
  COVALENT_IOS_API_KEY,
} from 'react-native-dotenv';
import { arbitrumEnabled } from '../config/debug';
// eslint-disable-next-line import/no-cycle
import { addressAssetsReceived, fetchAssetPrices } from './data';
// eslint-disable-next-line import/no-cycle
import { emitAssetRequest, emitChartsRequest } from './explorer';
import { AssetTypes } from '@rainbow-me/entities';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  ARBITRUM_ETH_ADDRESS,
  arbitrumTokenMapping,
} from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';

// -- Constants --------------------------------------- //
const ARBITRUM_EXPLORER_CLEAR_STATE = 'explorer/ARBITRUM_EXPLORER_CLEAR_STATE';
const ARBITRUM_EXPLORER_SET_BALANCE_HANDLER =
  'explorer/ARBITRUM_EXPLORER_SET_BALANCE_HANDLER';
const ARBITRUM_EXPLORER_SET_HANDLERS =
  'explorer/ARBITRUM_EXPLORER_SET_HANDLERS';
const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 30000;

const network = networkTypes.arbitrum;

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
      // Arbitrum ETH has no contract address since it's the native token
      const contractAddress = item.contract_address || ARBITRUM_ETH_ADDRESS;
      const mainnetAddress = arbitrumTokenMapping[toLower(contractAddress)];
      const coingeckoId = coingeckoIds[toLower(mainnetAddress)];
      let price = {
        changed_at: updatedAt,
        relative_change_24h: 0,
      };

      // Overrides
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
          asset_code: contractAddress,
          coingecko_id: coingeckoId,
          decimals: item.contract_decimals,
          icon_url: item.logo_url,
          mainnet_address: mainnetAddress,
          name: item.contract_name,
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

export const arbitrumExplorerInit = () => async (dispatch, getState) => {
  if (!arbitrumEnabled) return;
  const { accountAddress, nativeCurrency } = getState().settings;
  const { assets: allAssets, genericAssets } = getState().data;
  const { coingeckoIds } = getState().additionalAssetsData;
  const formattedNativeCurrency = toLower(nativeCurrency);

  const fetchAssetsBalancesAndPrices = async () => {
    const chainId = ethereumUtils.getChainIdFromNetwork(network);
    const assets = await getAssetsFromCovalent(
      chainId,
      accountAddress,
      AssetTypes.arbitrum,
      formattedNativeCurrency,
      coingeckoIds,
      allAssets,
      genericAssets
    );

    if (!assets || !assets.length) {
      const arbitrumExplorerBalancesHandle = setTimeout(
        fetchAssetsBalancesAndPrices,
        10000
      );
      dispatch({
        payload: {
          arbitrumExplorerBalancesHandle,
        },
        type: ARBITRUM_EXPLORER_SET_BALANCE_HANDLER,
      });
      return;
    }

    const tokenAddresses = assets.map(
      ({ asset: { asset_code } }) => asset_code
    );

    dispatch(emitAssetRequest(tokenAddresses));
    dispatch(emitChartsRequest(tokenAddresses));

    const prices = await fetchAssetPrices(
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
        true
      )
    );

    const arbitrumExplorerBalancesHandle = setTimeout(
      fetchAssetsBalancesAndPrices,
      UPDATE_BALANCE_AND_PRICE_FREQUENCY
    );
    let arbitrumExplorerAssetsHandle = null;

    dispatch({
      payload: {
        arbitrumExplorerAssetsHandle,
        arbitrumExplorerBalancesHandle,
      },
      type: ARBITRUM_EXPLORER_SET_HANDLERS,
    });
  };
  fetchAssetsBalancesAndPrices();
};

export const arbitrumExplorerClearState = () => (dispatch, getState) => {
  const {
    arbitrumExplorerBalancesHandle,
    arbitrumExplorerAssetsHandle,
  } = getState().arbitrumExplorer;

  arbitrumExplorerBalancesHandle &&
    clearTimeout(arbitrumExplorerBalancesHandle);
  arbitrumExplorerAssetsHandle && clearTimeout(arbitrumExplorerAssetsHandle);
  dispatch({ type: ARBITRUM_EXPLORER_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  arbitrumExplorerAssetsHandle: null,
  arbitrumExplorerBalancesHandle: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ARBITRUM_EXPLORER_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    case ARBITRUM_EXPLORER_SET_HANDLERS:
      return {
        ...state,
        arbitrumExplorerAssetsHandle:
          action.payload.arbitrumExplorerAssetsHandle,
        arbitrumExplorerBalancesHandle:
          action.payload.arbitrumExplorerBalancesHandle,
      };
    case ARBITRUM_EXPLORER_SET_BALANCE_HANDLER:
      return {
        ...state,
        arbitrumExplorerBalancesHandle:
          action.payload.arbitrumExplorerBalancesHandle,
      };
    default:
      return state;
  }
};
