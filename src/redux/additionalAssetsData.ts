import axios from 'axios';
import { fetchCoingeckoIds } from '@rainbow-me/redux/fallbackExplorer';
import { AppDispatch, AppState } from '@rainbow-me/redux/store';

// -- Constants ------------------------------------------------------------- //
const ADDITIONAL_ASSET_DATA_ADD = 'additionalAssetData/ADDITIONAL_ASSET_DATA';

export type AdditionalData = {
  description?: string;
  totalVolumeInEth?: number;
  totalSupply?: number;
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

export const additionalAssetsDataAdd = (address: string) => async (
  dispatch: AppDispatch,
  getState: () => AppState
) => {
  const token = getState().additionalAssetsData[address];
  if (token) {
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

    const totalVolumeInEth = data?.data?.market_data?.total_volume?.eth;

    const totalSupply = data?.data?.market_data?.total_supply;

    console.log(totalVolumeInEth, data?.data?.market_data?.total_volume);
    const newData: AdditionalData = {};
    if (totalVolumeInEth) {
      newData.totalVolumeInEth = totalVolumeInEth;
    }
    if (description) {
      newData.description = description;
    }
    if (totalSupply) {
      newData.totalSupply = totalSupply;
    }
    const payload: State = {
      [address]: {
        coingeckoId: 'dd',
        data: newData,
      },
    };
    dispatch({ payload, type: ADDITIONAL_ASSET_DATA_ADD });
  }
};

export const additionalDataCoingeckoIds = async (
  dispatch: AppDispatch,
  getState: () => AppState
) => {
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
