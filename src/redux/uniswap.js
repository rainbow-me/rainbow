import produce from 'immer';
import {
  concat,
  get,
  isEmpty,
  map,
} from 'lodash';
import {
  getUniswapAllowances,
  getUniswapLiquidityInfo,
  getUniswapLiquidityTokens,
  removeUniswapAllowances,
  removeUniswapLiquidityInfo,
  removeUniswapLiquidityTokens,
  saveUniswapAllowances,
  saveUniswapLiquidityInfo,
  saveUniswapLiquidityTokens,
} from '../handlers/commonStorage';
import { getLiquidityInfo } from '../handlers/uniswap';

// -- Constants ------------------------------------------------------------- //
const UNISWAP_LOAD_REQUEST = 'uniswap/UNISWAP_LOAD_REQUEST';
const UNISWAP_LOAD_SUCCESS = 'uniswap/UNISWAP_LOAD_SUCCESS';
const UNISWAP_LOAD_FAILURE = 'uniswap/UNISWAP_LOAD_FAILURE';

const UNISWAP_UPDATE_REQUEST = 'uniswap/UNISWAP_UPDATE_REQUEST';
const UNISWAP_UPDATE_SUCCESS = 'uniswap/UNISWAP_UPDATE_SUCCESS';
const UNISWAP_UPDATE_FAILURE = 'uniswap/UNISWAP_UPDATE_FAILURE';

const UNISWAP_UPDATE_ALLOWANCES = 'uniswap/UNISWAP_UPDATE_ALLOWANCES';
const UNISWAP_UPDATE_LIQUIDITY_TOKENS = 'uniswap/UNISWAP_UPDATE_LIQUIDITY_TOKENS';
const UNISWAP_CLEAR_STATE = 'uniswap/UNISWAP_CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //
export const uniswapLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({ type: UNISWAP_LOAD_REQUEST });
  try {
    const uniswap = await getUniswapLiquidityInfo(accountAddress, network);
    const liquidityTokens = await getUniswapLiquidityTokens(accountAddress, network);
    const allowances = await getUniswapAllowances(accountAddress, network);
    dispatch({
      payload: { allowances, liquidityTokens, uniswap },
      type: UNISWAP_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: UNISWAP_LOAD_FAILURE });
  }
};

export const uniswapClearState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  removeUniswapAllowances(accountAddress, network);
  removeUniswapLiquidityInfo(accountAddress, network);
  removeUniswapLiquidityTokens(accountAddress, network);
  dispatch({ type: UNISWAP_CLEAR_STATE });
};

export const uniswapUpdateAllowances = (tokenAddress, allowance) => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { allowances } = getState().uniswap;
  const updatedAllowances = { ...allowances, [tokenAddress]: allowance };
  dispatch({
    payload: updatedAllowances,
    type: UNISWAP_UPDATE_ALLOWANCES,
  });
  saveUniswapAllowances(accountAddress, updatedAllowances, network);
};

export const uniswapUpdateLiquidityTokens = (liquidityTokens) => (dispatch, getState) => {
  if (isEmpty(liquidityTokens)) return;
  const { accountAddress, network } = getState().settings;
  dispatch({
    payload: liquidityTokens,
    type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
  });
  saveUniswapLiquidityTokens(accountAddress, liquidityTokens, network);
  dispatch(uniswapUpdateState());
};


export const uniswapAddLiquidityTokens = (newLiquidityTokens) => (dispatch, getState) => {
  if (isEmpty(newLiquidityTokens)) return;
  const { accountAddress, network } = getState().settings;
  const { liquidityTokens } = getState().uniswap;
  const updatedLiquidityTokens = concat(liquidityTokens, ...newLiquidityTokens);
  dispatch({
    payload: updatedLiquidityTokens,
    type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
  });
  saveUniswapLiquidityTokens(accountAddress, updatedLiquidityTokens, network);
  dispatch(uniswapUpdateState());
};

export const uniswapUpdateState = () => (dispatch, getState) => (
  new Promise((resolve, reject) => {
    const { accountAddress, network } = getState().settings;
    const { liquidityTokens } = getState().uniswap;

    if (isEmpty(liquidityTokens)) {
      return resolve(false);
    }

    dispatch({ type: UNISWAP_UPDATE_REQUEST });

    const exchangeContracts = map(liquidityTokens, x => get(x, 'asset.asset_code'));
    return getLiquidityInfo(accountAddress, exchangeContracts)
      .then(uniswap => {
        saveUniswapLiquidityInfo(accountAddress, uniswap, network);
        dispatch({
          payload: uniswap,
          type: UNISWAP_UPDATE_SUCCESS,
        });
        resolve(true);
      })
      .catch(error => {
        dispatch({ type: UNISWAP_UPDATE_FAILURE });
        reject(error);
      });
  })
);

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNISWAP_STATE = {
  allowances: {},
  fetchingUniswap: false,
  liquidityTokens: [],
  loadingUniswap: false,
  uniswap: {},
};

export default (state = INITIAL_UNISWAP_STATE, action) => produce(state, draft => {
  switch (action.type) {
  case UNISWAP_LOAD_REQUEST:
    draft.loadingUniswap = true;
    break;
  case UNISWAP_LOAD_SUCCESS:
    draft.loadingUniswap = false;
    draft.allowances = action.payload.allowances;
    draft.uniswap = action.payload.uniswap;
    draft.liquidityTokens = action.payload.liquidityTokens;
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
  case UNISWAP_UPDATE_LIQUIDITY_TOKENS:
    draft.liquidityTokens = action.payload;
    break;
  case UNISWAP_UPDATE_ALLOWANCES:
    draft.allowances = action.payload;
    break;
  case UNISWAP_CLEAR_STATE:
    return INITIAL_UNISWAP_STATE;
  default:
    break;
  }
});
