import { getUnixTime, startOfMinute, sub } from 'date-fns';
import { uniswapClient } from '../apollo/client';
import { TOKEN_DATA, UNISWAP_ADDITIONAL_TOKEN_DATA } from '../apollo/queries';
import { getOneDayVolume } from '../hooks/useUniswapPools';
import { rainbowFetch } from '../rainbow-fetch';
import { fetchCoingeckoIds } from '@rainbow-me/redux/data';
import { AppDispatch, AppState } from '@rainbow-me/redux/store';
import { ETH_ADDRESS, WETH_ADDRESS } from '@rainbow-me/references';
import { getBlocksFromTimestamps } from '@rainbow-me/utils';
import logger from 'logger';

// -- Constants ------------------------------------------------------------- //
const ADDITIONAL_ASSET_DATA_COINGECKO =
  'additionalAssetData/ADDITIONAL_ASSET_DATA_COINGECKO';
const ADDITIONAL_ASSET_DATA_UNISWAP =
  'additionalAssetData/ADDITIONAL_ASSET_DATA_UNISWAP';
const ADDITIONAL_ASSET_DATA_COINGECKO_IDS =
  'additionalAssetData/ADDITIONAL_ASSET_DATA_COINGOCKO_IDS';

export type AdditionalDataCongecko = {
  description?: string;
  circulatingSupply?: number;
  links?: object;
};

export type AdditionalDataUniswap = {
  oneDayVolumeUSD?: number;
};

export type AdditionalData = {
  coingeckoData?: AdditionalDataCongecko;
};

type AdditionalAssetCoingeckoDataAction = {
  type: typeof ADDITIONAL_ASSET_DATA_COINGECKO;
  payload: AdditionalDataCoingeckoState;
};

type AdditionalAssetCoingeckoIdsAction = {
  type: typeof ADDITIONAL_ASSET_DATA_COINGECKO_IDS;
  payload: CoingeckoMappingState;
};

type AdditionalAssetUniswapDataAction = {
  type: typeof ADDITIONAL_ASSET_DATA_UNISWAP;
  payload: AdditionalDataUniswapState;
};

type Action =
  | AdditionalAssetCoingeckoDataAction
  | AdditionalAssetCoingeckoIdsAction
  | AdditionalAssetUniswapDataAction;

type AdditionalDataCoingeckoState = {
  [key: string]: AdditionalDataCongecko;
};
type AdditionalDataUniswapState = {
  [key: string]: AdditionalDataUniswap;
};

type CoingeckoMappingState = {
  [key: string]: string;
};

type State = {
  coingeckoIds: CoingeckoMappingState;
  coingeckoData: AdditionalDataCoingeckoState;
  uniswapData: AdditionalDataUniswapState;
};

// -- Actions --------------------------------------------------------------- //

export const additionalAssetsDataAddCoingecko = (address: string) => async (
  dispatch: AppDispatch,
  getState: () => AppState
) => {
  const newData: AdditionalDataCongecko = {};
  const token = getState().additionalAssetsData.coingeckoIds[address];
  if (token) {
    try {
      const data = (await rainbowFetch(
        `https://api.coingecko.com/api/v3/coins/${token}`,
        {
          method: 'get',
          params: {
            community_data: true,
            developer_data: false,
            localization: false,
            market_data: true,
            sparkline: false,
            tickers: false,
          },
        }
      )) as any;
      const description = data?.data?.description?.en?.replace(
        /<\/?[^>]+(>|$)/g,
        ''
      ); //strip HTML

      const circulatingSupply =
        data?.data?.market_data?.circulating_supply ?? 0;

      const links = data?.data?.links || {};

      if (description) {
        newData!.description = description;
      }

      if (links) {
        newData!.links = links;
      }

      newData.circulatingSupply = circulatingSupply;
    } catch (e) {
      logger.log('Error with coingecko logic for additional asset data', e);
    }

    const payload = {
      [address]: newData,
    };

    dispatch({ payload, type: ADDITIONAL_ASSET_DATA_COINGECKO });
  }
};

export const additionalAssetsDataAddUniswap = (rawAddress: string) => async (
  dispatch: AppDispatch
) => {
  const address = rawAddress === ETH_ADDRESS ? WETH_ADDRESS : rawAddress;
  const newData: AdditionalDataUniswap = {};

  // uniswap v2 graph for the volume
  try {
    const t1 = getUnixTime(startOfMinute(sub(Date.now(), { days: 1 })));

    const [{ number: b1 }] = await getBlocksFromTimestamps([t1]);

    const tokenData = await uniswapClient.query({
      fetchPolicy: 'cache-first',
      query: UNISWAP_ADDITIONAL_TOKEN_DATA,
      variables: {
        address,
      },
    });

    const tradeVolumeUSD = tokenData?.data?.tokens?.[0]?.tradeVolumeUSD ?? 0;

    const oneDayResult = await uniswapClient.query({
      fetchPolicy: 'cache-first',
      query: TOKEN_DATA(address, b1),
    });
    const oneDayHistory = oneDayResult.data.tokens[0];

    if (!oneDayHistory) {
      newData.oneDayVolumeUSD = tradeVolumeUSD;
    } else {
      const oneDayVolumeUSD = getOneDayVolume(
        tradeVolumeUSD,
        oneDayHistory?.tradeVolumeUSD ?? 0
      );
      newData.oneDayVolumeUSD = oneDayVolumeUSD;
    }
  } catch (e) {
    logger.log('Error with Uniswap v2 fetching for additional asset data', e);
  }

  const payload = {
    [rawAddress]: newData,
  };

  dispatch({ payload, type: ADDITIONAL_ASSET_DATA_UNISWAP });
};

export const additionalDataCoingeckoIds = async (
  dispatch: AppDispatch,
  getState: () => AppState
) => {
  // @ts-ignore
  if (Object.keys(getState().additionalAssetsData.coingeckoIds).length === 0) {
    const ids: { [key: string]: string } = (await fetchCoingeckoIds()) as {
      [key: string]: string;
    };
    const newState: CoingeckoMappingState = Object.entries(ids).reduce(
      (acc, curr) => {
        acc[curr[0].toLowerCase()] = curr[1];
        return acc;
      },
      {} as CoingeckoMappingState
    );
    newState['eth'] = 'ethereum';
    dispatch({ payload: newState, type: ADDITIONAL_ASSET_DATA_COINGECKO_IDS });
  }
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNIQUE_TOKENS_STATE = {
  coingeckoData: {},
  coingeckoIds: {},
  uniswapData: {},
};

export default (state: State = INITIAL_UNIQUE_TOKENS_STATE, action: Action) => {
  switch (action.type) {
    case ADDITIONAL_ASSET_DATA_COINGECKO:
      return {
        ...state,
        coingeckoData: {
          ...state.coingeckoData,
          ...action.payload,
        },
      };
    case ADDITIONAL_ASSET_DATA_COINGECKO_IDS:
      return {
        ...state,
        coingeckoIds: {
          ...state.coingeckoIds,
          ...action.payload,
        },
      };

    case ADDITIONAL_ASSET_DATA_UNISWAP:
      return {
        ...state,
        uniswapData: {
          ...state.uniswapData,
          ...action.payload,
        },
      };
    default:
      return state;
  }
};
