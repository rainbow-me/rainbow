import produce from 'immer';
import { concat, filter, get, isEmpty, uniqBy } from 'lodash';
import {
  getLiquidity,
  getUniswapLiquidityInfo,
  saveLiquidity,
  saveLiquidityInfo,
} from '../handlers/localstorage/uniswap';
import { getLiquidityInfo } from '../handlers/uniswapLiquidity';

// -- Constants ------------------------------------------------------------- //
const UNISWAP_UPDATE_LIQUIDITY_TOKEN_INFO =
  'uniswap/UNISWAP_UPDATE_LIQUIDITY_TOKEN_INFO';

const UNISWAP_UPDATE_LIQUIDITY_TOKENS =
  'uniswap/UNISWAP_UPDATE_LIQUIDITY_TOKENS';
const UNISWAP_CLEAR_STATE = 'uniswap/UNISWAP_CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //
const hasTokenQuantity = token => token.quantity > 0;
const getAssetCode = token => get(token, 'asset.asset_code');

export const uniswapLiquidityLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  try {
    const uniswapLiquidityTokenInfo = await getUniswapLiquidityInfo(
      accountAddress,
      network
    );
    dispatch({
      payload: uniswapLiquidityTokenInfo,
      type: UNISWAP_UPDATE_LIQUIDITY_TOKEN_INFO,
    });
    const liquidityTokens = await getLiquidity(accountAddress, network);
    dispatch({
      payload: liquidityTokens,
      type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const uniswapLiquidityResetState = () => dispatch =>
  dispatch({ type: UNISWAP_CLEAR_STATE });

export const uniswapUpdateLiquidityTokens = (
  liquidityTokens,
  appendOrChange
) => (dispatch, getState) => {
  if (isEmpty(liquidityTokens)) return;
  let updatedLiquidityTokens = filter(liquidityTokens, hasTokenQuantity);
  if (appendOrChange) {
    const {
      liquidityTokens: existingLiquidityTokens,
    } = getState().uniswapLiquidity;
    updatedLiquidityTokens = uniqBy(
      concat(updatedLiquidityTokens, existingLiquidityTokens),
      getAssetCode
    );
  }
  const { accountAddress, network } = getState().settings;
  dispatch({
    payload: updatedLiquidityTokens,
    type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
  });
  saveLiquidity(updatedLiquidityTokens, accountAddress, network);
  dispatch(uniswapUpdateLiquidityState());
};

export const uniswapUpdateLiquidityState = () => async (dispatch, getState) => {
  const { accountAddress, chainId, network } = getState().settings;
  const { pairs } = getState().uniswap;
  const { liquidityTokens } = getState().uniswapLiquidity;

  if (isEmpty(liquidityTokens)) return;

  try {
    const liquidityInfo = await getLiquidityInfo(
      chainId,
      accountAddress,
      liquidityTokens,
      pairs
    );
    saveLiquidityInfo(liquidityInfo, accountAddress, network);
    dispatch({
      payload: liquidityInfo,
      type: UNISWAP_UPDATE_LIQUIDITY_TOKEN_INFO,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNISWAP_LIQUIDITY_STATE = {
  liquidityTokens: [],
  uniswapLiquidityTokenInfo: {},
};

export default (state = INITIAL_UNISWAP_LIQUIDITY_STATE, action) =>
  produce(state, draft => {
    switch (action.type) {
      case UNISWAP_UPDATE_LIQUIDITY_TOKEN_INFO:
        draft.uniswapLiquidityTokenInfo = action.payload;
        break;
      case UNISWAP_UPDATE_LIQUIDITY_TOKENS:
        draft.liquidityTokens = action.payload;
        break;
      case UNISWAP_CLEAR_STATE:
        return INITIAL_UNISWAP_LIQUIDITY_STATE;
      default:
        break;
    }
  });
