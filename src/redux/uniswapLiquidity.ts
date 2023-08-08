import { Dispatch } from 'redux';

// -- Constants ------------------------------------------------------------- //

const UNISWAP_LP_TOKENS_CLEAR_STATE = 'uniswap/UNISWAP_LP_TOKENS_CLEAR_STATE';

const UNISWAP_POOLS_DETAILS = 'uniswap/UNISWAP_POOLS_DETAILS';

// -- Actions --------------------------------------------------------------- //

/**
 * Partially loaded details for a Uniswap pool from The Graph API.
 */
export interface UniswapPoolAddressDetails {
  annualized_fees: number;
  liquidity: number;
  oneDayVolumeUSD: number;
}

/**
 * Represents the current state of the `uniswapLiquidity` reducer.
 */
interface UniswapLiquidityState {
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
  | UniswapLpTokensClearStateAction
  | UniswapPoolDetailsAction;

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

// -- Reducer --------------------------------------------------------------- //

export const INITIAL_UNISWAP_LIQUIDITY_STATE: UniswapLiquidityState = {
  poolsDetails: {},
};

export default (
  state: UniswapLiquidityState = INITIAL_UNISWAP_LIQUIDITY_STATE,
  action: UniswapLiquidityAction
): UniswapLiquidityState => {
  switch (action.type) {
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
