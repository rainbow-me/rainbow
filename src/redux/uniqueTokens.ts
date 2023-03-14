import { Dispatch } from 'redux';
import { UniqueAsset } from '@/entities';

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
 * Resets unique tokens, but not the showcase, in state.
 */
export const uniqueTokensResetState = () => (
  dispatch: Dispatch<UniqueTokensClearStateAction>
) => {
  dispatch({ type: UNIQUE_TOKENS_CLEAR_STATE });
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
