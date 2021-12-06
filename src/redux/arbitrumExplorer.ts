import { toLower } from 'lodash';
import isEqual from 'react-fast-compare';
// eslint-disable-next-line import/no-cycle
import { addressAssetsReceived, fetchAssetPricesWithCoingecko } from './data';
// eslint-disable-next-line import/no-cycle
import { emitAssetRequest, emitChartsRequest } from './explorer';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { AssetTypes } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/covalent'... Remove this comment to see the full error message
import { getAssetsFromCovalent } from '@rainbow-me/handlers/covalent';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkInf... Remove this comment to see the full error message
import networkInfo from '@rainbow-me/helpers/networkInfo';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  ARBITRUM_ETH_ADDRESS,
  arbitrumTokenMapping,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
} from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';

let lastUpdatePayload: any = null;
// -- Constants --------------------------------------- //
const ARBITRUM_EXPLORER_CLEAR_STATE = 'explorer/ARBITRUM_EXPLORER_CLEAR_STATE';
const ARBITRUM_EXPLORER_SET_BALANCE_HANDLER =
  'explorer/ARBITRUM_EXPLORER_SET_BALANCE_HANDLER';
const ARBITRUM_EXPLORER_SET_HANDLERS =
  'explorer/ARBITRUM_EXPLORER_SET_HANDLERS';
const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 60000;

const network = networkTypes.arbitrum;

const getArbitrumAssetsFromCovalent = async (
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
          network: networkTypes.arbitrum,
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

export const arbitrumExplorerInit = () => async (
  dispatch: any,
  getState: any
) => {
  if (networkInfo[networkTypes.arbitrum]?.disabled) return;
  const { accountAddress, nativeCurrency } = getState().settings;
  const { assets: allAssets, genericAssets } = getState().data;
  const { coingeckoIds } = getState().additionalAssetsData;
  const formattedNativeCurrency = toLower(nativeCurrency);

  const fetchAssetsBalancesAndPrices = async () => {
    const chainId = ethereumUtils.getChainIdFromNetwork(network);
    const assets = await getArbitrumAssetsFromCovalent(
      chainId,
      accountAddress,
      AssetTypes.arbitrum,
      formattedNativeCurrency,
      coingeckoIds,
      allAssets,
      genericAssets
    );

    if (!assets || !assets.length) {
      // Try again in one minute
      const arbitrumExplorerBalancesHandle = setTimeout(
        fetchAssetsBalancesAndPrices,
        UPDATE_BALANCE_AND_PRICE_FREQUENCY * 2
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
      ({ asset: { asset_code } }: any) => asset_code
    );

    dispatch(emitAssetRequest(tokenAddresses));
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
    dispatch(emitChartsRequest(tokenAddresses));

    const prices = await fetchAssetPricesWithCoingecko(
      assets.map(({ asset: { coingecko_id } }: any) => coingecko_id),
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
          networkTypes.arbitrum
        )
      );
      lastUpdatePayload = newPayload;
    }

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

export const arbitrumExplorerClearState = () => (
  dispatch: any,
  getState: any
) => {
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

export default (state = INITIAL_STATE, action: any) => {
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
