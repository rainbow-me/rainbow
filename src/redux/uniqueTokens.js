import { captureException } from '@sentry/react-native';
import { without } from 'lodash';
import {
  getUniqueTokens,
  removeUniqueTokens,
  saveUniqueTokens,
} from '../handlers/localstorage/accountLocal';
import { apiGetAccountUniqueTokens } from '../handlers/opensea-api';
import networkTypes from '../helpers/networkTypes';
import { dedupeAssetsWithFamilies, getFamilies } from '../parsers/uniqueTokens';
import { dataUpdateAssets } from './data';

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

// -- Actions --------------------------------------------------------------- //
let uniqueTokensHandle = null;

export const uniqueTokensLoadState = () => async (dispatch, getState) => {
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

export const uniqueTokensClearState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  removeUniqueTokens(accountAddress, network);
  clearTimeout(uniqueTokensHandle);
  dispatch({ type: UNIQUE_TOKENS_CLEAR_STATE });
};

export const uniqueTokensResetState = () => dispatch => {
  clearTimeout(uniqueTokensHandle);
  dispatch({ type: UNIQUE_TOKENS_CLEAR_STATE });
};

export const uniqueTokensRefreshState = () => async (dispatch, getState) => {
  const { network } = getState().settings;

  // Currently not supported in testnets
  if (network !== networkTypes.mainnet) {
    return;
  }

  dispatch(watchUniqueTokens());
};

const fetchUniqueTokens = () => async (dispatch, getState) => {
  dispatch({ type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST });
  const { accountAddress, network } = getState().settings;
  const { assets } = getState().data;
  const { uniqueTokens: existingUniqueTokens } = getState().uniqueTokens;
  try {
    const uniqueTokens = await apiGetAccountUniqueTokens(accountAddress);
    const existingFamilies = getFamilies(existingUniqueTokens);
    const newFamilies = getFamilies(uniqueTokens);
    const incomingFamilies = without(newFamilies, ...existingFamilies);
    if (incomingFamilies.length) {
      const dedupedAssets = dedupeAssetsWithFamilies(assets, incomingFamilies);
      dispatch(dataUpdateAssets(dedupedAssets));
    }
    saveUniqueTokens(uniqueTokens, accountAddress, network);
    dispatch({
      payload: uniqueTokens,
      type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE });
    captureException(error);
  }
};

const watchUniqueTokens = () => async dispatch => {
  try {
    await dispatch(fetchUniqueTokens());
    uniqueTokensHandle && clearTimeout(uniqueTokensHandle);
    uniqueTokensHandle = setTimeout(() => {
      dispatch(watchUniqueTokens());
    }, 15000); // 15 secs
  } catch (error) {
    uniqueTokensHandle && clearTimeout(uniqueTokensHandle);
    uniqueTokensHandle = setTimeout(() => {
      dispatch(watchUniqueTokens());
    }, 15000); // 15 secs
  }
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNIQUE_TOKENS_STATE = {
  fetchingUniqueTokens: false,
  loadingUniqueTokens: false,
  uniqueTokens: [],
};

export default (state = INITIAL_UNIQUE_TOKENS_STATE, action) => {
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
      return {
        ...state,
        fetchingUniqueTokens: true,
      };
    case UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS:
      return {
        ...state,
        fetchingUniqueTokens: false,
        uniqueTokens: action.payload,
      };
    case UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE:
      return {
        ...state,
        fetchingUniqueTokens: false,
      };
    case UNIQUE_TOKENS_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_UNIQUE_TOKENS_STATE,
      };
    default:
      return state;
  }
};
