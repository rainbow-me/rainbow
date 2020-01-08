import { captureException } from '@sentry/react-native';
import { without } from 'lodash';
import { apiGetAccountUniqueTokens } from '../handlers/opensea-api';
import {
  getUniqueTokens,
  saveUniqueTokens,
  removeUniqueTokens,
} from '../handlers/localstorage/accountLocal';
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
let getUniqueTokensInterval = null;

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
  clearInterval(getUniqueTokensInterval);
  dispatch({ type: UNIQUE_TOKENS_CLEAR_STATE });
};

export const uniqueTokensRefreshState = () => (dispatch, getState) =>
  new Promise((resolve, reject) => {
    const fetchUniqueTokens = () =>
      new Promise((fetchResolve, fetchReject) => {
        dispatch({ type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST });
        const { accountAddress, network } = getState().settings;
        const { assets } = getState().data;
        const { uniqueTokens: existingUniqueTokens } = getState().uniqueTokens;
        apiGetAccountUniqueTokens(accountAddress)
          .then(uniqueTokens => {
            const existingFamilies = getFamilies(existingUniqueTokens);
            const newFamilies = getFamilies(uniqueTokens);
            const incomingFamilies = without(newFamilies, ...existingFamilies);
            if (incomingFamilies.length) {
              const dedupedAssets = dedupeAssetsWithFamilies(
                assets,
                incomingFamilies
              );
              dispatch(dataUpdateAssets(dedupedAssets));
            }
            saveUniqueTokens(uniqueTokens, accountAddress, network);
            dispatch({
              payload: uniqueTokens,
              type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
            });
            fetchResolve(true);
          })
          .catch(error => {
            dispatch({ type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE });
            captureException(error);
            fetchReject(error);
          });
      });

    return fetchUniqueTokens()
      .then(() => {
        clearInterval(getUniqueTokensInterval);
        getUniqueTokensInterval = setInterval(fetchUniqueTokens, 15000); // 15 secs
        resolve(true);
      })
      .catch(error => {
        clearInterval(getUniqueTokensInterval);
        getUniqueTokensInterval = setInterval(fetchUniqueTokens, 15000); // 15 secs
        reject(error);
      });
  });

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
