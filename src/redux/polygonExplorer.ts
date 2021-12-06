import { toLower } from 'lodash';
import isEqual from 'react-fast-compare';
// eslint-disable-next-line import/no-cycle
import { addressAssetsReceived, fetchAssetPricesWithCoingecko } from './data';
// eslint-disable-next-line import/no-cycle
import { emitAssetRequest, emitChartsRequest } from './explorer';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { AssetTypes } from '@rainbow-me/entities';
//import networkInfo from '@rainbow-me/helpers/networkInfo';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/covalent'... Remove this comment to see the full error message
import { getAssetsFromCovalent } from '@rainbow-me/handlers/covalent';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkInf... Remove this comment to see the full error message
import networkInfo from '@rainbow-me/helpers/networkInfo';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  COVALENT_ETH_ADDRESS,
  MATIC_MAINNET_ADDRESS,
  MATIC_POLYGON_ADDRESS,
  WETH_ADDRESS,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
} from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

let lastUpdatePayload: any = null;
// -- Constants --------------------------------------- //
const POLYGON_EXPLORER_CLEAR_STATE = 'explorer/POLYGON_EXPLORER_CLEAR_STATE';
const POLYGON_EXPLORER_SET_BALANCE_HANDLER =
  'explorer/POLYGON_EXPLORER_SET_BALANCE_HANDLER';
const POLYGON_EXPLORER_SET_HANDLERS = 'explorer/POLYGON_EXPLORER_SET_HANDLERS';

const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 60000;
const network = networkTypes.polygon;
let tokenMapping = {};

const fetchAssetsMapping = async () => {
  const fetchPage = async (page: any) => {
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
  let fullMapping: any = [];
  while (next) {
    const pageData = await fetchPage(page);
    next = pageData.has_next_page;
    fullMapping = fullMapping.concat(pageData.mapping);
    if (next) {
      page++;
    }
  }

  const mapping = {};
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'mappingData' implicitly has an 'any' ty... Remove this comment to see the full error message
  fullMapping.forEach(mappingData => {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    mapping[`${toLower(mappingData.child_token)}`] = mappingData.root_token;
  });
  return mapping;
};

const getPolygonAssetsFromCovalent = async (
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
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      let mainnetAddress = tokenMapping[toLower(item.contract_address)];
      let coingeckoId = coingeckoIds[toLower(mainnetAddress)];
      let price = {
        changed_at: updatedAt,
        relative_change_24h: 0,
      };

      // Overrides
      if (toLower(mainnetAddress) === toLower(COVALENT_ETH_ADDRESS)) {
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
          name: item.contract_name?.replace(' (PoS)', ''),
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

export const polygonExplorerInit = () => async (
  dispatch: any,
  getState: any
) => {
  if (networkInfo[networkTypes.polygon]?.disabled) return;
  const { accountAddress, nativeCurrency } = getState().settings;
  const { assets: allAssets, genericAssets } = getState().data;
  const { coingeckoIds } = getState().additionalAssetsData;
  const formattedNativeCurrency = toLower(nativeCurrency);
  tokenMapping = await fetchAssetsMapping();

  const fetchAssetsBalancesAndPrices = async () => {
    const chainId = ethereumUtils.getChainIdFromNetwork(network);
    const assets = await getPolygonAssetsFromCovalent(
      chainId,
      accountAddress,
      AssetTypes.polygon,
      formattedNativeCurrency,
      coingeckoIds,
      allAssets,
      genericAssets
    );

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

export const polygonExplorerClearState = () => (
  dispatch: any,
  getState: any
) => {
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

export default (state = INITIAL_STATE, action: any) => {
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
