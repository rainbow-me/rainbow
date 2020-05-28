import { captureException } from '@sentry/react-native';
import { concat, isEmpty, without } from 'lodash';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '../handlers/localstorage/accountLocal';
import {
  apiGetAccountUniqueTokens,
  UNIQUE_TOKENS_LIMIT_PER_PAGE,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '../handlers/opensea-api';
import NetworkTypes from '../helpers/networkTypes';
import { dedupeAssetsWithFamilies, getFamilies } from '../parsers/uniqueTokens';
/* eslint-disable-next-line import/no-cycle */
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

export const uniqueTokensResetState = () => dispatch => {
  uniqueTokensHandle && clearTimeout(uniqueTokensHandle);
  dispatch({ type: UNIQUE_TOKENS_CLEAR_STATE });
};

export const uniqueTokensRefreshState = () => async (dispatch, getState) => {
  const { network } = getState().settings;

  // Currently not supported in testnets
  if (network !== NetworkTypes.mainnet && network !== NetworkTypes.rinkeby) {
    return;
  }

  dispatch(fetchUniqueTokens());
};

const fetchUniqueTokens = () => async (dispatch, getState) => {
  dispatch({ type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST });
  const { accountAddress, network } = getState().settings;
  const { assets } = getState().data;
  const { uniqueTokens: existingUniqueTokens } = getState().uniqueTokens;
  const shouldUpdateInBatches = isEmpty(existingUniqueTokens);

  let shouldStopFetching = false;
  let page = 0;
  let uniqueTokens = [];

  const fetchPage = async () => {
    try {
      const newPageResults = await apiGetAccountUniqueTokens(
        network,
        accountAddress,
        page
      );

      // check that the account address to fetch for has not changed
      const { accountAddress: currentAccountAddress } = getState().settings;
      if (currentAccountAddress !== accountAddress) return;

      uniqueTokens = concat(uniqueTokens, newPageResults);
      shouldStopFetching =
        newPageResults.length < UNIQUE_TOKENS_LIMIT_PER_PAGE ||
        uniqueTokens.length >= UNIQUE_TOKENS_LIMIT_TOTAL;
      page += 1;

      if (shouldUpdateInBatches) {
        dispatch({
          payload: uniqueTokens,
          type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
        });
      }

      if (shouldStopFetching) {
        if (!shouldUpdateInBatches) {
          dispatch({
            payload: uniqueTokens,
            type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
          });
        }
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
      } else {
        uniqueTokensHandle = setTimeout(fetchPage, 200);
      }
    } catch (error) {
      dispatch({ type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE });
      captureException(error);
    }
  };

  fetchPage();
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
