import { isEmpty, uniqBy } from 'lodash';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { emitChartsRequest } from './explorer';
import { AppGetState, AppState } from './store';
import { ParsedAddressAsset } from '@/entities';
import { getLiquidity, saveLiquidity } from '@/handlers/localstorage/uniswap';

// -- Constants ------------------------------------------------------------- //

const UNISWAP_UPDATE_LIQUIDITY_TOKENS =
  'uniswap/UNISWAP_UPDATE_LIQUIDITY_TOKENS';
const UNISWAP_LP_TOKENS_CLEAR_STATE = 'uniswap/UNISWAP_LP_TOKENS_CLEAR_STATE';

const UNISWAP_POOLS_DETAILS = 'uniswap/UNISWAP_POOLS_DETAILS';

// -- Actions --------------------------------------------------------------- //

/**
 * Details for a token within a Uniswap pool.
 */
interface UniswapPoolToken {
  id: string;
  name: string;
  symbol: string;
}

/**
 * Fully loaded details for a Uniswap pool from the dispersion API.
 */
export interface UniswapPoolAddressDetailsFull {
  address: string | undefined;
  annualized_fees: number;
  liquidity: number;
  oneDayVolumeUSD: number;
  profit30d: number | undefined;
  symbol: string;
  token0: UniswapPoolToken;
  token1: UniswapPoolToken;
  tokens?: [UniswapPoolToken, UniswapPoolToken];
  tokenNames: string;
  type: string;
}

/**
 * Partially loaded details for a Uniswap pool from The Graph API.
 */
type UniswapPoolAddressDetailsPartial = Pick<
  UniswapPoolAddressDetailsFull,
  'annualized_fees' | 'liquidity' | 'oneDayVolumeUSD'
>;

/**
 * Details for a loaded Uniswap pool.
 */
type UniswapPoolAddressDetails =
  | UniswapPoolAddressDetailsFull
  | UniswapPoolAddressDetailsPartial;

/**
 * Represents the current state of the `uniswapLiquidity` reducer.
 */
interface UniswapLiquidityState {
  /**
   * An array of loaded liquidity tokens.
   */
  liquidityTokens: ParsedAddressAsset[];

  /**
   * An object mapping pool addresses to pool details.
   */
  poolsDetails: {
    [address: string]: UniswapPoolAddressDetails;
  };
}

/**
 * An action for the `uniswapLiquidity` reducer.
 */
type UniswapLiquidityAction =
  | UniswapUpdateLiquidityTokensAction
  | UniswapLpTokensClearStateAction
  | UniswapPoolDetailsAction;

/**
 * The action for updating liquidity tokens.
 */
interface UniswapUpdateLiquidityTokensAction {
  type: typeof UNISWAP_UPDATE_LIQUIDITY_TOKENS;
  payload: UniswapLiquidityState['liquidityTokens'];
}

/**
 * The action for resetting the state.
 */
interface UniswapLpTokensClearStateAction {
  type: typeof UNISWAP_LP_TOKENS_CLEAR_STATE;
}

/**
 * The action for updating the pool details.
 */
interface UniswapPoolDetailsAction {
  type: typeof UNISWAP_POOLS_DETAILS;
  payload: UniswapLiquidityState['poolsDetails'];
}

/**
 * Loads liquidity tokens from local storage and updates state.
 */
export const uniswapLiquidityLoadState = () => async (
  dispatch: Dispatch<UniswapUpdateLiquidityTokensAction>,
  getState: AppGetState
) => {
  const { accountAddress, network } = getState().settings;
  try {
    const liquidityTokens = await getLiquidity(accountAddress, network);
    dispatch({
      payload: liquidityTokens,
      type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

/**
 * Resets the state.
 */
export const uniswapLiquidityResetState = () => (
  dispatch: Dispatch<UniswapLpTokensClearStateAction>
) => dispatch({ type: UNISWAP_LP_TOKENS_CLEAR_STATE });

/**
 * Updates pool details in state by changing the keys included in
 * `poolDetailsUpdate` to their new values.
 *
 * @param poolDetailsUpdate The object of pool detail updates.
 */
export const setPoolsDetails = (
  poolDetailsUpdate: UniswapPoolDetailsAction['payload']
) => (dispatch: Dispatch<UniswapPoolDetailsAction>) =>
  dispatch({ payload: poolDetailsUpdate, type: UNISWAP_POOLS_DETAILS });

/**
 * Updates liquidity tokens in state by either appending or replacing with
 * new tokens. If tokens are being replaced, a new chart request is emitted.
 *
 * @param liquidityTokens The liquidity tokens to update.
 * @param appendOrChange Whether this update should append the provided tokens,
 * as opposed to replacing the tokens in state.
 */
export const uniswapUpdateLiquidityTokens = (
  liquidityTokens: ParsedAddressAsset[],
  appendOrChange: boolean
) => (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    UniswapUpdateLiquidityTokensAction
  >,
  getState: AppGetState
) => {
  if (appendOrChange && isEmpty(liquidityTokens)) return;
  let updatedLiquidityTokens = liquidityTokens;
  if (appendOrChange) {
    const {
      liquidityTokens: existingLiquidityTokens,
    } = getState().uniswapLiquidity;

    updatedLiquidityTokens = uniqBy(
      updatedLiquidityTokens.concat(existingLiquidityTokens),
      token => token.address
    ).filter(token => !!Number(token?.balance?.amount ?? 0));
  } else {
    const assetCodes = liquidityTokens.map(token => token.address);
    dispatch(emitChartsRequest(assetCodes));
  }
  const { accountAddress, network } = getState().settings;
  dispatch({
    payload: updatedLiquidityTokens,
    type: UNISWAP_UPDATE_LIQUIDITY_TOKENS,
  });
  saveLiquidity(updatedLiquidityTokens, accountAddress, network);
};

// -- Reducer --------------------------------------------------------------- //

export const INITIAL_UNISWAP_LIQUIDITY_STATE: UniswapLiquidityState = {
  liquidityTokens: [],
  poolsDetails: {},
};

export default (
  state: UniswapLiquidityState = INITIAL_UNISWAP_LIQUIDITY_STATE,
  action: UniswapLiquidityAction
): UniswapLiquidityState => {
  switch (action.type) {
    case UNISWAP_UPDATE_LIQUIDITY_TOKENS:
      return { ...state, liquidityTokens: action.payload };
    case UNISWAP_POOLS_DETAILS:
      return {
        ...state,
        poolsDetails: { ...state.poolsDetails, ...action.payload },
      };
    case UNISWAP_LP_TOKENS_CLEAR_STATE:
      return INITIAL_UNISWAP_LIQUIDITY_STATE;
    default:
      return state;
  }
};
