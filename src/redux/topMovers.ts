import { map, pick } from 'lodash';
import {
  getTopMovers,
  saveTopGainers,
  saveTopLosers,
} from '../handlers/localstorage/topMovers';
import { emitChartsRequest } from './explorer';
import { AppDispatch } from './store';

interface ZerionAsset {
  asset_code: string;
  decimals: number;
  name: string;
  price: ZerionAssetPrice;
  symbol: string;
}

interface ZerionAssetInfo {
  asset: ZerionAsset;
}

interface ZerionAssetInfoResponse {
  meta: {
    order_by: {
      'relative_changes.1d': string;
    };
  };
  payload: {
    info: ZerionAssetInfo[];
  };
}

interface ZerionAssetPrice {
  changed_at: number;
  relative_change_24h: number;
  value: number;
}

interface TopMover {
  address: string;
  decimals: number;
  name: string;
  price: ZerionAssetPrice;
  symbol: string;
}

interface TopMoversState {
  gainers: TopMover[];
  losers: TopMover[];
}

interface TopMoversLoadSuccessAction {
  type: typeof TOP_MOVERS_LOAD_SUCCESS;
  payload: TopMoversState;
}

interface TopMoversUpdateGainersAction {
  type: typeof TOP_MOVERS_UPDATE_GAINERS;
  payload: TopMoversState['gainers'];
}

interface TopMoversUpdateLosersAction {
  type: typeof TOP_MOVERS_UPDATE_LOSERS;
  payload: TopMoversState['losers'];
}

export type TopMoversActionType =
  | TopMoversLoadSuccessAction
  | TopMoversUpdateGainersAction
  | TopMoversUpdateLosersAction;

// -- Constants --------------------------------------- //
const TOP_MOVERS_UPDATE_GAINERS = 'topMovers/TOP_MOVERS_UPDATE_GAINERS';
const TOP_MOVERS_UPDATE_LOSERS = 'topMovers/TOP_MOVERS_UPDATE_LOSERS';
const TOP_MOVERS_LOAD_SUCCESS = 'topMovers/TOP_MOVERS_LOAD_SUCCESS';
const TOP_MOVERS_LOAD_FAILURE = 'topMovers/TOP_MOVERS_LOAD_FAILURE';

// -- Actions ---------------------------------------- //
export const topMoversLoadState = () => async (dispatch: AppDispatch) => {
  try {
    const topMovers = await getTopMovers();
    dispatch({
      payload: topMovers,
      type: TOP_MOVERS_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: TOP_MOVERS_LOAD_FAILURE });
  }
};

export const updateTopMovers = (message: ZerionAssetInfoResponse) => (
  dispatch: AppDispatch
) => {
  const orderByDirection = message.meta.order_by['relative_changes.1d'];
  const info: TopMover[] = map(message.payload.info, ({ asset }) => {
    const item = pick(asset, ['decimals', 'name', 'price', 'symbol']);
    return {
      address: asset.asset_code,
      ...item,
    };
  });
  const assetCodes = map(info, asset => asset.address);
  dispatch(emitChartsRequest(assetCodes));

  if (orderByDirection === 'asc') {
    dispatch({
      payload: info,
      type: TOP_MOVERS_UPDATE_LOSERS,
    });
    saveTopLosers(info);
  } else {
    dispatch({
      payload: info,
      type: TOP_MOVERS_UPDATE_GAINERS,
    });
    saveTopGainers(info);
  }
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  gainers: [],
  losers: [],
};

export default (state = INITIAL_STATE, action: TopMoversActionType) => {
  switch (action.type) {
    case TOP_MOVERS_LOAD_SUCCESS:
      return {
        ...state,
        gainers: action.payload.gainers,
        losers: action.payload.losers,
      };
    case TOP_MOVERS_UPDATE_GAINERS:
      return {
        ...state,
        gainers: action.payload,
      };
    case TOP_MOVERS_UPDATE_LOSERS:
      return {
        ...state,
        losers: action.payload,
      };
    default:
      return state;
  }
};
