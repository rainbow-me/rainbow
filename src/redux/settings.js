import {
  getNativeCurrency,
  getNetwork,
  saveLanguage,
  saveNativeCurrency,
  saveNetwork,
} from '../handlers/localstorage/globalSettings';
import { web3Provider, web3SetHttpProvider } from '../handlers/web3';
import networkTypes from '../helpers/networkTypes';
import { updateLanguage } from '../languages';

import { ethereumUtils } from '../utils';
import { dataResetState } from './data';
import { explorerClearState, explorerInit } from './explorer';

// -- Constants ------------------------------------------------------------- //

const SETTINGS_UPDATE_SETTINGS_ADDRESS =
  'settings/SETTINGS_UPDATE_SETTINGS_ADDRESS';
const SETTINGS_UPDATE_SETTINGS_ENS = 'settings/SETTINGS_UPDATE_SETTINGS_ENS';
const SETTINGS_UPDATE_SETTINGS_COLOR =
  'settings/SETTINGS_UPDATE_SETTINGS_COLOR';
const SETTINGS_UPDATE_SETTINGS_NAME = 'settings/SETTINGS_UPDATE_SETTINGS_NAME';
const SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS =
  'settings/SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS';
const SETTINGS_UPDATE_NATIVE_CURRENCY_FAILURE =
  'settings/SETTINGS_UPDATE_NATIVE_CURRENCY_FAILURE';

const SETTINGS_UPDATE_LANGUAGE_SUCCESS =
  'settings/SETTINGS_UPDATE_LANGUAGE_SUCCESS';
const SETTINGS_UPDATE_LANGUAGE_FAILURE =
  'settings/SETTINGS_UPDATE_LANGUAGE_FAILURE';

const SETTINGS_UPDATE_NETWORK_SUCCESS =
  'settings/SETTINGS_UPDATE_NETWORK_SUCCESS';
const SETTINGS_UPDATE_NETWORK_FAILURE =
  'settings/SETTINGS_UPDATE_NETWORK_FAILURE';

// -- Actions --------------------------------------------------------------- //
export const settingsLoadState = () => async dispatch => {
  try {
    const nativeCurrency = await getNativeCurrency();
    dispatch({
      payload: nativeCurrency,
      type: SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: SETTINGS_UPDATE_NATIVE_CURRENCY_FAILURE });
  }
};

export const settingsLoadNetwork = () => async dispatch => {
  try {
    const network = await getNetwork();
    const chainId = ethereumUtils.getChainIdFromNetwork(network);
    await web3SetHttpProvider(network);
    dispatch({
      payload: { chainId, network },
      type: SETTINGS_UPDATE_NETWORK_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: SETTINGS_UPDATE_NETWORK_FAILURE });
  }
};

export const settingsUpdateAccountName = accountName => dispatch => {
  dispatch({
    payload: { accountName },
    type: SETTINGS_UPDATE_SETTINGS_NAME,
  });
};

export const settingsUpdateAccountColor = accountColor => dispatch => {
  dispatch({
    payload: { accountColor },
    type: SETTINGS_UPDATE_SETTINGS_COLOR,
  });
};

export const settingsUpdateAccountAddress = accountAddress => async dispatch => {
  dispatch({
    payload: accountAddress,
    type: SETTINGS_UPDATE_SETTINGS_ADDRESS,
  });

  await web3Provider.lookupAddress(accountAddress).then(accountENS =>
    dispatch({
      payload: accountENS,
      type: SETTINGS_UPDATE_SETTINGS_ENS,
    })
  );
};

export const settingsUpdateNetwork = network => async dispatch => {
  const chainId = ethereumUtils.getChainIdFromNetwork(network);
  await web3SetHttpProvider(network);
  try {
    dispatch({
      payload: { chainId, network },
      type: SETTINGS_UPDATE_NETWORK_SUCCESS,
    });
    saveNetwork(network);
  } catch (error) {
    dispatch({
      type: SETTINGS_UPDATE_NETWORK_FAILURE,
    });
  }
};

export const settingsChangeLanguage = language => dispatch => {
  updateLanguage(language);
  saveLanguage(language)
    .then(() =>
      dispatch({
        payload: language,
        type: SETTINGS_UPDATE_LANGUAGE_SUCCESS,
      })
    )
    .catch(() =>
      dispatch({
        type: SETTINGS_UPDATE_LANGUAGE_FAILURE,
      })
    );
};

export const settingsChangeNativeCurrency = nativeCurrency => dispatch => {
  dispatch(dataResetState());
  dispatch(explorerClearState());
  saveNativeCurrency(nativeCurrency)
    .then(() => {
      dispatch({
        payload: nativeCurrency,
        type: SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS,
      });
      dispatch(explorerInit());
    })
    .catch(() => {
      dispatch({
        type: SETTINGS_UPDATE_NATIVE_CURRENCY_FAILURE,
      });
    });
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_STATE = {
  accountAddress: '',
  accountColor: 6,
  accountENS: null,
  accountName: '🤑',
  chainId: 1,
  language: 'en',
  nativeCurrency: 'USD',
  network: networkTypes.mainnet,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SETTINGS_UPDATE_SETTINGS_ADDRESS:
      return {
        ...state,
        accountAddress: action.payload,
      };
    case SETTINGS_UPDATE_SETTINGS_ENS:
      return {
        ...state,
        accountENS: action.payload,
      };
    case SETTINGS_UPDATE_SETTINGS_NAME:
      return {
        ...state,
        accountName: action.payload.accountName,
      };
    case SETTINGS_UPDATE_SETTINGS_COLOR:
      return {
        ...state,
        accountColor: action.payload.accountColor,
      };
    case SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS:
      return {
        ...state,
        nativeCurrency: action.payload,
      };
    case SETTINGS_UPDATE_NATIVE_CURRENCY_FAILURE:
      return {
        ...state,
      };
    case SETTINGS_UPDATE_NETWORK_SUCCESS:
      return {
        ...state,
        chainId: action.payload.chainId,
        network: action.payload.network,
      };
    case SETTINGS_UPDATE_LANGUAGE_SUCCESS:
      return {
        ...state,
        language: action.payload,
      };
    case SETTINGS_UPDATE_LANGUAGE_FAILURE:
      return {
        ...state,
      };
    default:
      return state;
  }
};
