import { apiGetAccountUniqueTokens } from '../handlers/opensea-api.js';
import {
  getUniqueTokens,
  saveUniqueTokens,
  removeUniqueTokens,
  removeWalletConnect,
} from '../handlers/commonStorage';

// -- Constants ------------------------------------------------------------- //
const ASSETS_LOAD_UNIQUE_TOKENS_REQUEST =
  'assets/ASSETS_LOAD_UNIQUE_TOKENS_REQUEST';
const ASSETS_LOAD_UNIQUE_TOKENS_SUCCESS =
  'assets/ASSETS_LOAD_UNIQUE_TOKENS_SUCCESS';
const ASSETS_LOAD_UNIQUE_TOKENS_FAILURE =
  'assets/ASSETS_LOAD_UNIQUE_TOKENS_FAILURE';

const ASSETS_GET_UNIQUE_TOKENS_REQUEST =
  'assets/ASSETS_GET_UNIQUE_TOKENS_REQUEST';
const ASSETS_GET_UNIQUE_TOKENS_SUCCESS =
  'assets/ASSETS_GET_UNIQUE_TOKENS_SUCCESS';
const ASSETS_GET_UNIQUE_TOKENS_FAILURE =
  'assets/ASSETS_GET_UNIQUE_TOKENS_FAILURE';

const ASSETS_CLEAR_STATE = 'assets/ASSETS_CLEAR_STATE';

// -- Actions --------------------------------------------------------------- //
let getUniqueTokensInterval = null;

export const accountClearState = () => dispatch => {
  dispatch(assetsClearState());
  removeWalletConnect();
};

export const accountLoadState = () => dispatch => {
  dispatch(uniqueTokensLoadState());
};

const uniqueTokensLoadState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  dispatch({ type: ASSETS_LOAD_UNIQUE_TOKENS_REQUEST });
  getUniqueTokens(accountAddress, network).then(cachedUniqueTokens => {
    dispatch({
      type: ASSETS_LOAD_UNIQUE_TOKENS_SUCCESS,
      payload: cachedUniqueTokens,
    });
  })
  .catch(error => {
    dispatch({ type: ASSETS_LOAD_UNIQUE_TOKENS_FAILURE });
  });
};

const assetsClearState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  removeUniqueTokens(accountAddress, network);
  clearInterval(getUniqueTokensInterval);
  dispatch({ type: ASSETS_CLEAR_STATE });
};

export const uniqueTokensRefreshState = () => dispatch => {
  return dispatch(assetsGetUniqueTokens());
};

const assetsGetUniqueTokens = () => (dispatch, getState) => new Promise((resolve, reject) => {
  dispatch({ type: ASSETS_GET_UNIQUE_TOKENS_REQUEST });
  const { accountAddress, network } = getState().settings;
  const fetchUniqueTokens = () => new Promise((resolve, reject) => {
    apiGetAccountUniqueTokens(accountAddress)
      .then(uniqueTokens => {
        saveUniqueTokens(accountAddress, uniqueTokens, network);
        dispatch({
          type: ASSETS_GET_UNIQUE_TOKENS_SUCCESS,
          payload: uniqueTokens,
        });
        resolve(true);
      }).catch(error => {
        dispatch({ type: ASSETS_GET_UNIQUE_TOKENS_FAILURE });
        reject(error);
      });
  });
  fetchUniqueTokens().then(() => {
    clearInterval(getUniqueTokensInterval);
    getUniqueTokensInterval = setInterval(fetchUniqueTokens, 15000); // 15 secs
    resolve(true);
  }).catch(error => {
    clearInterval(getUniqueTokensInterval);
    getUniqueTokensInterval = setInterval(fetchUniqueTokens, 15000); // 15 secs
    reject(error);
  });
});


// -- Reducer --------------------------------------------------------------- //
export const INITIAL_ASSETS_STATE = {
  fetchingUniqueTokens: false,
  loadingUniqueTokens: false,
  uniqueTokens: [],
};

export default (state = INITIAL_ASSETS_STATE, action) => {
  switch (action.type) {
    case ASSETS_LOAD_UNIQUE_TOKENS_REQUEST:
      return {
        ...state,
        loadingUniqueTokens: true,
      };
    case ASSETS_LOAD_UNIQUE_TOKENS_SUCCESS:
      return {
        ...state,
        loadingUniqueTokens: false,
        uniqueTokens: action.payload,
      };
    case ASSETS_LOAD_UNIQUE_TOKENS_FAILURE:
      return {
        ...state,
        loadingUniqueTokens: false
      };
    case ASSETS_GET_UNIQUE_TOKENS_REQUEST:
      return {
        ...state,
        fetchingUniqueTokens: true,
      };
    case ASSETS_GET_UNIQUE_TOKENS_SUCCESS:
      return {
        ...state,
        fetchingUniqueTokens: false,
        uniqueTokens: action.payload,
      };
    case ASSETS_GET_UNIQUE_TOKENS_FAILURE:
      return {
        ...state,
        fetchingUniqueTokens: false
      };
    case ASSETS_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_ASSETS_STATE,
      };
    default:
      return state;
  }
};
