import { getCoingeckoIds } from '@rainbow-me/handlers/dispersion';
import { AppDispatch, AppState } from '@rainbow-me/redux/store';

// -- Constants ------------------------------------------------------------- //
const ADDITIONAL_ASSET_DATA_COINGECKO_IDS =
  'additionalAssetData/ADDITIONAL_ASSET_DATA_COINGOCKO_IDS';

export type AdditionalDataUniswap = {
  oneDayVolumeUSD?: number;
};

type AdditionalAssetCoingeckoIdsAction = {
  type: typeof ADDITIONAL_ASSET_DATA_COINGECKO_IDS;
  payload: CoingeckoMappingState;
};

type Action = AdditionalAssetCoingeckoIdsAction;

type CoingeckoMappingState = {
  [key: string]: string;
};

type State = {
  coingeckoIds: CoingeckoMappingState;
};

// -- Actions --------------------------------------------------------------- //
export const additionalDataCoingeckoIds = async (
  dispatch: AppDispatch,
  getState: () => AppState
) => {
  // @ts-ignore
  if (Object.keys(getState().additionalAssetsData.coingeckoIds).length === 0) {
    const idMap = await getCoingeckoIds();
    idMap['eth'] = 'ethereum';
    dispatch({ payload: idMap, type: ADDITIONAL_ASSET_DATA_COINGECKO_IDS });
  }
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNIQUE_TOKENS_STATE = {
  coingeckoIds: {},
};

export default (state: State = INITIAL_UNIQUE_TOKENS_STATE, action: Action) => {
  switch (action.type) {
    case ADDITIONAL_ASSET_DATA_COINGECKO_IDS:
      return {
        ...state,
        coingeckoIds: {
          ...state.coingeckoIds,
          ...action.payload,
        },
      };
    default:
      return state;
  }
};
