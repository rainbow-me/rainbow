import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { concat, isEmpty, without } from 'lodash';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { dataUpdateAssets } from './data';
import { AppGetState, AppState } from './store';
import { AssetType, UniqueAsset } from '@rainbow-me/entities';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '@rainbow-me/handlers/localstorage/accountLocal';
import {
  apiGetAccountUniqueTokens,
  UNIQUE_TOKENS_LIMIT_PER_PAGE,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '@rainbow-me/handlers/opensea-api';
import { fetchPoaps } from '@rainbow-me/handlers/poap';
import NetworkTypes from '@rainbow-me/networkTypes';
import { dedupeAssetsWithFamilies, getFamilies } from '@rainbow-me/parsers';

// -- Constants ------------------------------------------------------------- //

const UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST =
  'uniqueTokens/UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST';
const UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS =
  'uniqueTokens/UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS';
const UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE =
  'uniqueTokens/UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE';

const UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST =
  'uniqueTokens/UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST';
const UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS =
  'uniqueTokens/UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS';
const UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE =
  'uniqueTokens/UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE';

const UNIQUE_TOKENS_CLEAR_STATE = 'uniqueTokens/UNIQUE_TOKENS_CLEAR_STATE';
const UNIQUE_TOKENS_CLEAR_STATE_SHOWCASE =
  'uniqueTokens/UNIQUE_TOKENS_CLEAR_STATE_SHOWCASE';

// -- Actions --------------------------------------------------------------- //

/**
 * Represents the current state of the `uniqueTokens` reducer.
 */
interface UniqueTokensState {
  /**
   * Whether or not unique tokens are currently being fetched via API.
   */
  fetchingUniqueTokens: boolean;

  /**
   * Whether or not unique showcased tokens are currently being fetched via
   * API.
   */
  fetchingUniqueTokensShowcase: boolean;

  /**
   * Whether or not unique tokens are currently being loaded from local
   * storage.
   */
  loadingUniqueTokens: boolean;

  /**
   * Whether or not unique showcased tokens are currently being loaded from
   * local storage.
   */
  loadingUniqueTokensShowcase: boolean;

  /**
   * The user's unique tokens.
   */
  uniqueTokens: UniqueAsset[];

  /**
   * The user's unique showcased tokens.
   */
  uniqueTokensShowcase: UniqueAsset[];
}

/**
 * An action for the `uniqueTokens` reducer.
 */
type UniqueTokensAction =
  | UniqueTokensLoadAction
  | UniqueTokensGetAction
  | UniqueTokensClearStateAction
  | UniqueTokensClearStateShowcaseAction;

/**
 * The action for starting to load unique tokens from local storage.
 */
interface UniqueTokensLoadUniqueTokensRequestAction {
  type: typeof UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST;
}

/**
 * The action used when unique tokens are loaded successfully from local
 * storage.
 */
interface UniqueTokensLoadUniqueTokensSuccessAction {
  type: typeof UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS;
  payload: UniqueAsset[];
}

/**
 * The action used when loading unique tokens from local storage fails.
 */
interface UniqueTokensLoadUniqueTokensFailureAction {
  type: typeof UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE;
}

/**
 * An action related to loading tokens from local storage.
 */
type UniqueTokensLoadAction =
  | UniqueTokensLoadUniqueTokensRequestAction
  | UniqueTokensLoadUniqueTokensSuccessAction
  | UniqueTokensLoadUniqueTokensFailureAction;

/**
 * The action for starting to fetch unique tokens via API.
 */
interface UniqueTokensGetUniqueTokensRequestAction {
  type: typeof UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST;
  showcase: boolean;
}

/**
 * The action used when unique tokens have been fetched from the API
 * successfully.
 */
interface UniqueTokensGetUniqueTokensSuccessAction {
  type: typeof UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS;
  showcase: boolean;
  payload: UniqueAsset[];
}

/**
 * The action used when fetching unique tokens via API fails.
 */
interface UniqueTokensGetUniqueTokensFailureAction {
  type: typeof UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE;
  showcase: boolean;
}

/**
 * An action related to fetching unique tokens by API.
 */
type UniqueTokensGetAction =
  | UniqueTokensGetUniqueTokensRequestAction
  | UniqueTokensGetUniqueTokensSuccessAction
  | UniqueTokensGetUniqueTokensFailureAction;

/**
 * The action used to reset the state for unique tokens, but not the showcase.
 */
interface UniqueTokensClearStateAction {
  type: typeof UNIQUE_TOKENS_CLEAR_STATE;
}

/**
 * The action used to clear the showcase state.
 */
interface UniqueTokensClearStateShowcaseAction {
  type: typeof UNIQUE_TOKENS_CLEAR_STATE_SHOWCASE;
}

/**
 * An ID for a timeout used when fetching pages of tokens.
 */
let uniqueTokensHandle: null | ReturnType<typeof setTimeout> = null;

/**
 * Loads unique tokens from local storage and updates state.
 */
export const uniqueTokensLoadState = () => async (
  dispatch: Dispatch<UniqueTokensLoadAction>,
  getState: AppGetState
) => {
  const { accountAddress, network } = getState().settings;
  dispatch({ type: UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST });
  try {
    const cachedUniqueTokens = await getUniqueTokens(accountAddress, network);
    dispatch({
      payload: cachedUniqueTokens,
      type: UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE });
  }
};

/**
 * Resets unique tokens, but not the showcase, in state.
 */
export const uniqueTokensResetState = () => (
  dispatch: Dispatch<UniqueTokensClearStateAction>
) => {
  uniqueTokensHandle && clearTimeout(uniqueTokensHandle);
  dispatch({ type: UNIQUE_TOKENS_CLEAR_STATE });
};

/**
 * Fetches unique tokens via API, updates state, and saves to local storage,
 * as long as the current network is either mainnet or rinkeby.
 */
export const uniqueTokensRefreshState = () => async (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
  const { network } = getState().settings;

  // Currently not supported in testnets
  if (network !== NetworkTypes.mainnet && network !== NetworkTypes.rinkeby) {
    return;
  }

  dispatch(fetchUniqueTokens());
};

/**
 * Fetches unique tokens or showcased unique tokens via API, updates state,
 * and saves to local storage.
 *
 * @param showcaseAddress The showcase address to use for fetching, or no
 * address to fetch all unique tokens.
 */
export const fetchUniqueTokens = (showcaseAddress?: string) => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    UniqueTokensGetAction | UniqueTokensClearStateShowcaseAction
  >,
  getState: AppGetState
) => {
  dispatch({
    showcase: !!showcaseAddress,
    type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
  });
  if (showcaseAddress) {
    dispatch({
      type: UNIQUE_TOKENS_CLEAR_STATE_SHOWCASE,
    });
  }
  const { network } = getState().settings;
  const accountAddress = showcaseAddress || getState().settings.accountAddress;
  const { accountAssetsData } = getState().data;
  const { uniqueTokens: existingUniqueTokens } = getState().uniqueTokens;
  const shouldUpdateInBatches = isEmpty(existingUniqueTokens);

  let shouldStopFetching = false;
  let page = 0;
  let uniqueTokens: UniqueAsset[] = [];

  const fetchPage = async network => {
    try {
      const newPageResults = await apiGetAccountUniqueTokens(
        network,
        accountAddress,
        page
      );

      // check that the account address to fetch for has not changed
      const currentAccountAddress =
        showcaseAddress || getState().settings.accountAddress;
      if (currentAccountAddress !== accountAddress) return;

      uniqueTokens = concat(uniqueTokens, newPageResults);
      shouldStopFetching =
        newPageResults.length < UNIQUE_TOKENS_LIMIT_PER_PAGE ||
        uniqueTokens.length >= UNIQUE_TOKENS_LIMIT_TOTAL;
      page += 1;

      if (shouldUpdateInBatches) {
        dispatch({
          payload: uniqueTokens,
          showcase: !!showcaseAddress,
          type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
        });
      }
      if (shouldStopFetching) {
        const poaps = (await fetchPoaps(accountAddress)) ?? [];
        if (poaps.length > 0) {
          uniqueTokens = uniqueTokens.filter(
            token => token.familyName !== 'POAP'
          );
          uniqueTokens = concat(uniqueTokens, poaps);
        }

        if (!shouldUpdateInBatches) {
          dispatch({
            payload: uniqueTokens,
            showcase: !!showcaseAddress,
            type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
          });
        }
        const existingFamilies = getFamilies(existingUniqueTokens);
        const newFamilies = getFamilies(uniqueTokens);
        const incomingFamilies = without(newFamilies, ...existingFamilies);
        if (incomingFamilies.length) {
          const dedupedAssets = dedupeAssetsWithFamilies(
            accountAssetsData,
            incomingFamilies
          );
          dispatch(dataUpdateAssets(dedupedAssets));
        }
        if (!showcaseAddress) {
          analytics.identify(null, { NFTs: uniqueTokens.length });
          saveUniqueTokens(uniqueTokens, accountAddress, network);
        }
      } else {
        uniqueTokensHandle = setTimeout(fetchPage, 200);
      }
    } catch (error) {
      dispatch({
        showcase: !!showcaseAddress,
        type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
      });
      captureException(error);
    }
  };

  fetchPage(network);
  fetchPage(AssetType.polygon);
};

// -- Reducer --------------------------------------------------------------- //

export const INITIAL_UNIQUE_TOKENS_STATE: UniqueTokensState = {
  fetchingUniqueTokens: false,
  fetchingUniqueTokensShowcase: false,
  loadingUniqueTokens: false,
  loadingUniqueTokensShowcase: false,
  uniqueTokens: [],
  uniqueTokensShowcase: [],
};

export default (
  state: UniqueTokensState = INITIAL_UNIQUE_TOKENS_STATE,
  action: UniqueTokensAction
): UniqueTokensState => {
  switch (action.type) {
    case UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST:
      return {
        ...state,
        loadingUniqueTokens: true,
      };
    case UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS:
      return {
        ...state,
        loadingUniqueTokens: false,
        uniqueTokens: action.payload,
      };
    case UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE:
      return {
        ...state,
        loadingUniqueTokens: false,
      };
    case UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST:
      if (action.showcase) {
        return {
          ...state,
          fetchingUniqueTokensShowcase: true,
        };
      } else {
        return {
          ...state,
          fetchingUniqueTokens: true,
        };
      }
    case UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS:
      if (action.showcase) {
        return {
          ...state,
          fetchingUniqueTokensShowcase: false,
          uniqueTokensShowcase: action.payload,
        };
      } else {
        return {
          ...state,
          fetchingUniqueTokens: false,
          uniqueTokens: action.payload,
        };
      }
    case UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE:
      if (action.showcase) {
        return {
          ...state,
          fetchingUniqueTokensShowcase: false,
        };
      } else {
        return {
          ...state,
          fetchingUniqueTokens: false,
        };
      }

    case UNIQUE_TOKENS_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_UNIQUE_TOKENS_STATE,
      };
    case UNIQUE_TOKENS_CLEAR_STATE_SHOWCASE:
      return {
        ...state,
        ...{
          fetchingUniqueTokensShowcase: false,
          loadingUniqueTokensShowcase: false,
          uniqueTokensShowcase: [],
        },
      };
    default:
      return state;
  }
};
