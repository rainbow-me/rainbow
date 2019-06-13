import produce from 'immer';
import { filter, map } from 'lodash';
import {
  getUniswap,
  removeUniswap,
  saveUniswap,
} from '../handlers/commonStorage';
import { getUniswapLiquidityInfo } from '../handlers/uniswap';

// -- Constants ------------------------------------------------------------- //
const UNISWAP_LOAD_REQUEST = 'uniswap/UNISWAP_LOAD_REQUEST';
const UNISWAP_LOAD_SUCCESS = 'uniswap/UNISWAP_LOAD_SUCCESS';
const UNISWAP_LOAD_FAILURE = 'uniswap/UNISWAP_LOAD_FAILURE';

const UNISWAP_UPDATE_REQUEST = 'uniswap/UNISWAP_UPDATE_REQUEST';
const UNISWAP_UPDATE_SUCCESS = 'uniswap/UNISWAP_UPDATE_SUCCESS';
const UNISWAP_UPDATE_FAILURE = 'uniswap/UNISWAP_UPDATE_FAILURE';

const UNISWAP_CLEAR_STATE = 'uniswap/UNISWAP_CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //
export const uniswapLoadState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({ type: UNISWAP_LOAD_REQUEST });
  getUniswap(accountAddress, network)
    .then(uniswap => {
      dispatch({
        type: UNISWAP_LOAD_SUCCESS,
        payload: uniswap,
      });
    })
    .catch(error => {
      dispatch({ type: UNISWAP_LOAD_FAILURE });
    });
};

export const uniswapClearState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  removeUniswap(accountAddress, network);
  dispatch({ type: UNISWAP_CLEAR_STATE });
};

export const uniswapUpdateState = () => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { accountAddress, network } = getState().settings;
    const { assets } = getState().data;

    const liquidityTokens = filter(assets, ({ symbol }) => symbol === 'UNI-V1');
    const exchangeContracts = map(liquidityTokens, x => x.address);

    dispatch({ type: UNISWAP_UPDATE_REQUEST });
    getUniswapLiquidityInfo(accountAddress, exchangeContracts)
      .then(uniswap => {
        saveUniswap(accountAddress, uniswap, network);
        dispatch({
          type: UNISWAP_UPDATE_SUCCESS,
          payload: uniswap,
        });
      })
      .catch(error => {
        dispatch({ type: UNISWAP_UPDATE_FAILURE });
        reject(error);
      });
  });
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNISWAP_STATE = {
  fetchingUniswap: false,
  loadingUniswap: false,
  uniswap: {},
};

export default (state = INITIAL_UNISWAP_STATE, action) =>
  produce(state, draft => {
    switch (action.type) {
      case UNISWAP_LOAD_REQUEST:
        draft.loadingUniswap = true;
        break;
      case UNISWAP_LOAD_SUCCESS:
        draft.loadingUniswap = false;
        draft.uniswap = action.payload;
        break;
      case UNISWAP_LOAD_FAILURE:
        draft.loadingUniswap = false;
        break;
      case UNISWAP_UPDATE_REQUEST:
        draft.fetchingUniswap = true;
        break;
      case UNISWAP_UPDATE_SUCCESS:
        draft.fetchingUniswap = false;
        draft.uniswap = action.payload;
        break;
      case UNISWAP_UPDATE_FAILURE:
        draft.fetchingUniswap = false;
        break;
      case UNISWAP_CLEAR_STATE:
        draft = INITIAL_UNISWAP_STATE;
        break;
      default:
        break;
    }
  });
