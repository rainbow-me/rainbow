import produce from 'immer';
import isArray from 'lodash/isArray';
import toLower from 'lodash/toLower';
import uniq from 'lodash/uniq';
import without from 'lodash/without';
import { Dispatch } from 'redux';
import { AppGetState } from './store';
import {
  EthereumAddress,
  RainbowToken,
  UniswapFavoriteTokenData,
} from '@/entities';
import { getUniswapV2Tokens } from '@/handlers/dispersion';
import {
  getUniswapFavorites,
  getUniswapFavoritesMetadata as getUniswapFavoritesMetadataLS,
  saveUniswapFavorites,
  saveUniswapFavoritesMetadata,
} from '@/handlers/localstorage/uniswap';
import { getTestnetUniswapPairs } from '@/handlers/swap';
import { Network } from '@/helpers/networkTypes';
import {
  DefaultUniswapFavorites,
  DefaultUniswapFavoritesMeta,
  ETH_ADDRESS,
  rainbowTokenList,
  WETH_ADDRESS,
} from '@/references';
import logger from '@/utils/logger';

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
   * Data associated with user's favorite Uniswap pairs.
   */
  favoritesMeta: UniswapFavoriteTokenData;

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
  payload: {
    favorites: UniswapState['favorites'];
    favoritesMeta: UniswapState['favoritesMeta'];
  };
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
  payload: {
    favorites: UniswapState['favorites'];
    favoritesMeta: UniswapState['favoritesMeta'];
  };
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
    const favoritesMeta = await getUniswapFavoritesMetadataLS(network);
    dispatch({
      payload: {
        favorites,
        favoritesMeta,
      },
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
    network === Network.mainnet
      ? rainbowTokenList.CURATED_TOKENS
      : getTestnetUniswapPairs(network);
  dispatch({
    // @ts-expect-error
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
 * Loads uniswap favorites metadata from local storage or fetches new data
 * on update / when persisting default favorites for the first time
 */
const getUniswapFavoritesMetadata = async (
  addresses: EthereumAddress[]
): Promise<UniswapFavoriteTokenData> => {
  const favoritesMetadata: UniswapFavoriteTokenData = {};
  try {
    const newFavoritesMeta = await getUniswapV2Tokens(
      addresses.map(address => {
        return address === ETH_ADDRESS ? WETH_ADDRESS : address.toLowerCase();
      })
    );
    const ethIsFavorited = addresses.includes(ETH_ADDRESS);
    const wethIsFavorited = addresses.includes(WETH_ADDRESS);
    if (newFavoritesMeta) {
      if (newFavoritesMeta[WETH_ADDRESS] && ethIsFavorited) {
        const favorite = newFavoritesMeta[WETH_ADDRESS];
        newFavoritesMeta[ETH_ADDRESS] = {
          ...favorite,
          address: ETH_ADDRESS,
          name: 'Ethereum',
          symbol: 'ETH',
          uniqueId: ETH_ADDRESS,
        };
      }
      Object.entries(newFavoritesMeta).forEach(([address, favorite]) => {
        if (address !== WETH_ADDRESS || wethIsFavorited) {
          favoritesMetadata[address] = { ...favorite, favorite: true };
        }
      });
    }
  } catch (e) {
    logger.sentry(
      `An error occurred while fetching uniswap favorite metadata: ${e}`
    );
  }
  if (favoritesMetadata) {
    saveUniswapFavoritesMetadata(favoritesMetadata);
  }
  return favoritesMetadata;
};

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
) => async (
  dispatch: Dispatch<UniswapUpdateFavoritesAction>,
  getState: AppGetState
) => {
  const { favorites, favoritesMeta } = getState().uniswap;
  const normalizedFavorites = favorites.map(toLower);

  const updatedFavorites = add
    ? uniq(normalizedFavorites.concat(assetAddress))
    : isArray(assetAddress)
    ? without(normalizedFavorites, ...assetAddress)
    : without(normalizedFavorites, assetAddress);
  const updatedFavoritesMeta =
    (await getUniswapFavoritesMetadata(updatedFavorites)) || favoritesMeta;
  dispatch({
    payload: {
      favorites: updatedFavorites,
      favoritesMeta: updatedFavoritesMeta,
    },
    type: UNISWAP_UPDATE_FAVORITES,
  });
  saveUniswapFavorites(updatedFavorites);
  saveUniswapFavoritesMetadata(updatedFavoritesMeta);
};

// -- Reducer --------------------------------------------------------------- //

export const INITIAL_UNISWAP_STATE: UniswapState = {
  favorites: DefaultUniswapFavorites[Network.mainnet],
  favoritesMeta: DefaultUniswapFavoritesMeta[Network.mainnet],
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
        draft.favorites = action.payload.favorites;
        draft.favoritesMeta = action.payload.favoritesMeta;
        draft.loadingUniswap = false;
        break;
      case UNISWAP_UPDATE_FAVORITES:
        draft.favorites = action.payload.favorites;
        draft.favoritesMeta = action.payload.favoritesMeta;
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
