import { updateLanguage } from '../languages';
import {
  getLanguage,
  getNativeCurrency,
  saveLanguage,
  saveNativeCurrency,
} from '../handlers/commonStorage';
import { dataClearState, dataInit } from './data';
import { ethereumUtils } from '../utils';
import { web3SetHttpProvider } from '../handlers/web3';

// -- Constants ------------------------------------------------------------- //
const SETTINGS_UPDATE_NETWORK = 'settings/SETTINGS_UPDATE_NETWORK';
const SETTINGS_UPDATE_CHAIN_ID = 'settings/SETTINGS_UPDATE_CHAIN_ID';
const SETTINGS_UPDATE_SETTINGS_ADDRESS = 'settings/SETTINGS_UPDATE_SETTINGS_ADDRESS';

const SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS = 'settings/SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS';
const SETTINGS_UPDATE_NATIVE_CURRENCY_FAILURE = 'settings/SETTINGS_UPDATE_NATIVE_CURRENCY_FAILURE';

const SETTINGS_UPDATE_LANGUAGE_SUCCESS = 'settings/SETTINGS_UPDATE_LANGUAGE_SUCCESS';
const SETTINGS_UPDATE_LANGUAGE_FAILURE = 'settings/SETTINGS_UPDATE_LANGUAGE_FAILURE';

// -- Actions --------------------------------------------------------------- //
export const settingsLoadState = () => async dispatch => {
  try {
    const language = await getLanguage();
    dispatch({
      payload: language,
      type: SETTINGS_UPDATE_LANGUAGE_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: SETTINGS_UPDATE_LANGUAGE_FAILURE });
  }
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

export const settingsUpdateAccountAddress = (accountAddress, accountType) => (
  dispatch,
  getState,
) => {
  dispatch({
    payload: { accountAddress, accountType },
    type: SETTINGS_UPDATE_SETTINGS_ADDRESS,
  });
};

export const settingsUpdateNetwork = network => dispatch => {
  const chainId = ethereumUtils.getChainIdFromNetwork(network);
  web3SetHttpProvider(network);
  dispatch({
    payload: { chainId, network },
    type: SETTINGS_UPDATE_NETWORK,
  });
};

export const settingsUpdateChainId = chainId => dispatch => {
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  web3SetHttpProvider(network);
  dispatch({
    payload: { chainId, network },
    type: SETTINGS_UPDATE_CHAIN_ID,
  });
};

export const settingsChangeLanguage = language => dispatch => {
  updateLanguage(language);
  saveLanguage(language).then(() => {
    dispatch({
      payload: language,
      type: SETTINGS_UPDATE_LANGUAGE_SUCCESS,
    });
  }).catch(error => {
    dispatch({
      type: SETTINGS_UPDATE_LANGUAGE_FAILURE,
    });
  });
};

export const settingsChangeNativeCurrency = nativeCurrency => (
  dispatch,
) => {
  dispatch(dataClearState());
  saveNativeCurrency(nativeCurrency).then(() => {
    dispatch({
      payload: nativeCurrency,
      type: SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS,
    });
    dispatch(dataInit());
  }).catch(error => {
    dispatch({
      type: SETTINGS_UPDATE_NATIVE_CURRENCY_FAILURE,
    });
  });
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_STATE = {
  accountAddress: '',
  accountType: '',
  chainId: 1,
  language: 'en',
  nativeCurrency: 'USD',
  network: 'mainnet',
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SETTINGS_UPDATE_SETTINGS_ADDRESS:
    return {
      ...state,
      accountAddress: action.payload.accountAddress,
      accountType: action.payload.accountType,
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
  case SETTINGS_UPDATE_NETWORK:
    return {
      ...state,
      chainId: action.payload.chainId,
      network: action.payload.network,
    };
  case SETTINGS_UPDATE_CHAIN_ID:
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
