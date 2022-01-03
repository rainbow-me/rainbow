import produce from 'immer';
import { concat, isArray, map, remove, toLower, uniq, without } from 'lodash';
import { Dispatch } from 'redux';
import { AppGetState } from './store';
import { RainbowToken } from '@rainbow-me/entities';
import {
  getUniswapFavorites,
  saveUniswapFavorites,
} from '@rainbow-me/handlers/localstorage/uniswap';
import { getTestnetUniswapPairs } from '@rainbow-me/handlers/uniswap';
import networkTypes from '@rainbow-me/networkTypes';
import {
  DefaultUniswapFavorites,
  rainbowTokenList,
  SOCKS_ADDRESS,
} from '@rainbow-me/references';

// -- Constants ------------------------------------------------------------- //

const UNISWAP_LOAD_REQUEST = 'uniswap/UNISWAP_LOAD_REQUEST';
const UNISWAP_LOAD_SUCCESS = 'uniswap/UNISWAP_LOAD_SUCCESS';
const UNISWAP_LOAD_FAILURE = 'uniswap/UNISWAP_LOAD_FAILURE';

const UNISWAP_UPDATE_PAIRS = 'uniswap/UNISWAP_UPDATE_PAIRS';

const UNISWAP_UPDATE_FAVORITES = 'uniswap/UNISWAP_UPDATE_FAVORITES';
const UNISWAP_CLEAR_STATE = 'uniswap/UNISWAP_CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //

/**
 * Represents the current state of the `uniswap` reducer.
 */
interface UniswapState {
  /**
   * An array of addresses for the user's favorite Uniswap pairs.
   */
  favorites: string[];

  /**
   * Whether or not data from Uniswap is currently being loaded.
   */
  loadingUniswap: boolean;

  /**
   * Data for Uniswap pairs as an object mapping addresses to tokens.
   */
  pairs: Record<string, RainbowToken>;
}

/**
 * An action for the `uniswap` reducer.
 */
type UniswapAction =
  | UniswapLoadRequestAction
  | UniswapLoadSuccessAction
  | UniswapLoadFailureAction
  | UniswapUpdatePairsAction
  | UniswapUpdateFavoritesAction
  | UniswapClearStateAction;

/**
 * The action for starting to load data from Uniswap.
 */
interface UniswapLoadRequestAction {
  type: typeof UNISWAP_LOAD_REQUEST;
}

/**
 * The action used when data from Uniswap is loaded successfully.
 */
interface UniswapLoadSuccessAction {
  type: typeof UNISWAP_LOAD_SUCCESS;
  payload: UniswapState['favorites'];
}

/**
 * The action used when loading data from Uniswap fails.
 */
interface UniswapLoadFailureAction {
  type: typeof UNISWAP_LOAD_FAILURE;
}

/**
 * The action for updating Uniswap pair data.
 */
interface UniswapUpdatePairsAction {
  type: typeof UNISWAP_UPDATE_PAIRS;
  payload: UniswapState['pairs'];
}

/**
 * The action for updating Uniswap favorites.
 */
interface UniswapUpdateFavoritesAction {
  type: typeof UNISWAP_UPDATE_FAVORITES;
  payload: UniswapState['favorites'];
}

/**
 * The action for resetting the state.
 */
interface UniswapClearStateAction {
  type: typeof UNISWAP_CLEAR_STATE;
}

/**
 * Loads Uniswap favorites from global storage and updates state.
 */
export const uniswapLoadState = () => async (
  dispatch: Dispatch<
    | UniswapLoadRequestAction
    | UniswapLoadSuccessAction
    | UniswapLoadFailureAction
  >,
  getState: AppGetState
) => {
  const { network } = getState().settings;
  dispatch({ type: UNISWAP_LOAD_REQUEST });
  try {
    const favorites: string[] = await getUniswapFavorites(network);
    remove(favorites, address => toLower(address) === toLower(SOCKS_ADDRESS));
    dispatch({
      payload: favorites,
      type: UNISWAP_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: UNISWAP_LOAD_FAILURE });
  }
};

/**
 * Updates state to use initial data for Uniswap pairs.
 */
export const uniswapPairsInit = () => (
  dispatch: Dispatch<UniswapUpdatePairsAction>,
  getState: AppGetState
) => {
  const { network } = getState().settings;
  const pairs =
    network === networkTypes.mainnet
      ? rainbowTokenList.CURATED_TOKENS
      : getTestnetUniswapPairs(network);
  dispatch({
    // @ts-ignore
    payload: pairs,
    type: UNISWAP_UPDATE_PAIRS,
  });
};

/**
 * Resets the state.
 */
export const uniswapResetState = () => (
  dispatch: Dispatch<UniswapClearStateAction>
) => dispatch({ type: UNISWAP_CLEAR_STATE });

/**
 * Updates a user's Uniswap favorites in state and updates global storage.
 *
 * @param assetAddress The addresses to use when updating favorites.
 * @param add Whether these assets should be added or removed. `true` indicates
 * assets should be added and `false` indicates they should be removed.
 */
export const uniswapUpdateFavorites = (
  assetAddress: string | string[],
  add = true
) => (
  dispatch: Dispatch<UniswapUpdateFavoritesAction>,
  getState: AppGetState
) => {
  const { favorites } = getState().uniswap;
  const normalizedFavorites = map(favorites, toLower);

  const updatedFavorites = add
    ? uniq(concat(normalizedFavorites, assetAddress))
    : isArray(assetAddress)
    ? without(normalizedFavorites, ...assetAddress)
    : without(normalizedFavorites, assetAddress);
  dispatch({
    payload: updatedFavorites,
    type: UNISWAP_UPDATE_FAVORITES,
  });
  saveUniswapFavorites(updatedFavorites);
};

// -- Reducer --------------------------------------------------------------- //

export const INITIAL_UNISWAP_STATE: UniswapState = {
  favorites: DefaultUniswapFavorites['mainnet'],
  loadingUniswap: false,
  get pairs() {
    return rainbowTokenList.CURATED_TOKENS;
  },
};

export default (
  state: UniswapState = INITIAL_UNISWAP_STATE,
  action: UniswapAction
): UniswapState =>
  produce(state, draft => {
    switch (action.type) {
      case UNISWAP_LOAD_REQUEST:
        draft.loadingUniswap = true;
        break;
      case UNISWAP_UPDATE_PAIRS:
        draft.pairs = action.payload;
        break;
      case UNISWAP_LOAD_SUCCESS:
        draft.favorites = action.payload;
        draft.loadingUniswap = false;
        break;
      case UNISWAP_UPDATE_FAVORITES:
        draft.favorites = action.payload;
        break;
      case UNISWAP_LOAD_FAILURE:
        draft.loadingUniswap = false;
        break;
      case UNISWAP_CLEAR_STATE:
        return INITIAL_UNISWAP_STATE;
      default:
        break;
    }
  });
