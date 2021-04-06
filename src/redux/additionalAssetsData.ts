import axios from 'axios';
import { getUnixTime, startOfMinute, sub } from 'date-fns';
import { uniswapClient } from '../apollo/client';
import { TOKEN_DATA, UNISWAP_ADDITIONAL_TOKEN_DATA } from '../apollo/queries';
import {
  get2DayPercentChange,
  getBlocksFromTimestamps,
} from '../hooks/useUniswapPools';
import { fetchCoingeckoIds } from '@rainbow-me/redux/fallbackExplorer';
import { AppDispatch, AppState } from '@rainbow-me/redux/store';
import { logger } from '@rainbow-me/utils';

// -- Constants ------------------------------------------------------------- //
const ADDITIONAL_ASSET_DATA_ADD = 'additionalAssetData/ADDITIONAL_ASSET_DATA';

export type AdditionalData = {
  description?: string;
  circulatingSupply?: number;
  oneDayVolumeUSD?: number;
};

export type AdditionalDataWrapped = {
  coingeckoId: string;
  data?: AdditionalData;
};

type AdditionalAssetDataAddAction = {
  type: typeof ADDITIONAL_ASSET_DATA_ADD;
  payload: State;
};

type State = {
  [key: string]: AdditionalDataWrapped;
};

// -- Actions --------------------------------------------------------------- //

const getTimestampsForChanges = () => {
  const t1 = getUnixTime(startOfMinute(sub(Date.now(), { days: 1 })));
  const t2 = getUnixTime(startOfMinute(sub(Date.now(), { days: 2 })));
  return [t1, t2];
};

export const additionalAssetsDataAdd = (address: string) => async (
  dispatch: AppDispatch,
  getState: () => AppState
) => {
  const newData: AdditionalData = {};

  // coingecko logic
  // @ts-ignore
  const token = getState().additionalAssetsData[address];
  if (token) {
    try {
      const data = await axios({
        method: 'get',
        params: {
          community_data: false,
          developer_data: false,
          localization: false,
          market_data: true,
          sparkline: false,
          tickers: false,
        },
        url: `https://api.coingecko.com/api/v3/coins/${token.coingeckoId}`,
      });
      const description = data?.data?.description?.en?.replace(
        /<\/?[^>]+(>|$)/g,
        ''
      ); //strip HTML

      const circulatingSupply = data?.data?.market_data?.circulating_supply;

      if (description) {
        newData.description = description;
      }

      if (circulatingSupply) {
        newData.circulatingSupply = circulatingSupply;
      }
    } catch (e) {
      logger.log('Error with coingecko logic for additional asset data', e);
    }
  }

  // uniswap v2 graph for the volume
  try {
    const [t1, t2] = getTimestampsForChanges();
    const [{ number: b1 }, { number: b2 }] = await getBlocksFromTimestamps([
      t1,
      t2,
    ]);

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
    const twoDayResult = await uniswapClient.query({
      fetchPolicy: 'cache-first',
      query: TOKEN_DATA(address, b2),
    });
    const oneDayHistory = oneDayResult.data.tokens[0];
    const twoDayHistory = twoDayResult.data.tokens[0];

    if (!oneDayHistory || !twoDayHistory) {
      newData.oneDayVolumeUSD = tradeVolumeUSD;
    } else {
      const [oneDayVolumeUSD] = get2DayPercentChange(
        tradeVolumeUSD,
        oneDayHistory?.tradeVolumeUSD ?? 0,
        twoDayHistory?.tradeVolumeUSD ?? 0
      );
      newData.oneDayVolumeUSD = oneDayVolumeUSD;
    }
  } catch (e) {
    logger.log('Error with Uniswap v2 fetching for additional asset data', e);
  }

  const payload: State = {
    [address]: {
      coingeckoId: 'dd',
      data: newData,
    },
  };

  dispatch({ payload, type: ADDITIONAL_ASSET_DATA_ADD });
};

export const additionalDataCoingeckoIds = async (
  dispatch: AppDispatch,
  getState: () => AppState
) => {
  // @ts-ignore
  if (Object.keys(getState().additionalAssetsData).length === 0) {
    const ids: { [key: string]: string } = (await fetchCoingeckoIds()) as {
      [key: string]: string;
    };
    const newState: State = Object.entries(ids).reduce((acc, curr) => {
      acc[curr[0].toLowerCase()] = { coingeckoId: curr[1] };
      return acc;
    }, {} as State);
    newState['eth'] = { coingeckoId: 'ethereum' };
    dispatch({ payload: newState, type: ADDITIONAL_ASSET_DATA_ADD });
  }
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNIQUE_TOKENS_STATE = {};

export default (
  state: State = INITIAL_UNIQUE_TOKENS_STATE,
  action: AdditionalAssetDataAddAction
) => {
  switch (action.type) {
    case ADDITIONAL_ASSET_DATA_ADD:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};
