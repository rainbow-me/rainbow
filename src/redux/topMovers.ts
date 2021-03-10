import { map } from 'lodash';
import {
  getTopMovers,
  saveTopGainers,
  saveTopLosers,
} from '../handlers/localstorage/topMovers';
import { emitChartsRequest } from './explorer';
import { AppDispatch, AppGetState } from './store';
import { parseAsset, parseAssetsNative } from '@rainbow-me/parsers';

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

const MIN_MOVERS = 3;

export const updateTopMovers = (message: ZerionAssetInfoResponse) => (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  const { nativeCurrency } = getState().settings;
  const orderByDirection = message.meta.order_by['relative_changes.1d'];
  const assets = map(message.payload.info, ({ asset }) => {
    return parseAsset(asset);
  });
  const info = parseAssetsNative(assets, nativeCurrency);

  const assetCodes = map(info, asset => asset.address);
  dispatch(emitChartsRequest(assetCodes));

  if (orderByDirection === 'asc') {
    // If it's less than 5 better not to show anything lol
    const fixedLosers = info.filter(
      ({ price: { relative_change_24h } }) =>
        typeof relative_change_24h === 'number' && relative_change_24h < 0
    );

    const isEnoughTopLosers = fixedLosers.length >= MIN_MOVERS;
    dispatch({
      payload: isEnoughTopLosers ? fixedLosers : [],
      type: TOP_MOVERS_UPDATE_LOSERS,
    });
    saveTopLosers(isEnoughTopLosers ? fixedLosers : []);
  } else {
    const fixedGainers = info.filter(
      ({ price: { relative_change_24h } }) =>
        typeof relative_change_24h === 'number' && relative_change_24h > 0
    );
    const isEnoughTopGainers = fixedGainers.length >= MIN_MOVERS;

    dispatch({
      payload: isEnoughTopGainers ? fixedGainers : [],
      type: TOP_MOVERS_UPDATE_GAINERS,
    });
    saveTopGainers(isEnoughTopGainers ? fixedGainers : []);
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
