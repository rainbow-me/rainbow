import analytics from '@segment/analytics-react-native';
import { NativeCurrencyKeys } from '../entities/nativeCurrencyTypes';
import {
  getNativeCurrency,
  getNetwork,
  getTestnetsEnabled,
  saveLanguage,
  saveNativeCurrency,
  saveNetwork,
  saveTestnetsEnabled,
} from '../handlers/localstorage/globalSettings';
import { web3SetHttpProvider } from '../handlers/web3';
import networkTypes from '../helpers/networkTypes';
import { updateLanguage } from '../languages';

import { ethereumUtils } from '../utils';
import { dataResetState } from './data';
import { explorerClearState, explorerInit } from './explorer';
import logger from 'logger';

// -- Constants ------------------------------------------------------------- //
const SETTINGS_LOAD_STATE_SUCCESS = 'settings/SETTINGS_LOAD_STATE_SUCCESS';
const SETTINGS_UPDATE_SETTINGS_ADDRESS =
  'settings/SETTINGS_UPDATE_SETTINGS_ADDRESS';
const SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS =
  'settings/SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS';
const SETTINGS_UPDATE_LANGUAGE_SUCCESS =
  'settings/SETTINGS_UPDATE_LANGUAGE_SUCCESS';
const SETTINGS_UPDATE_NETWORK_SUCCESS =
  'settings/SETTINGS_UPDATE_NETWORK_SUCCESS';
const SETTINGS_UPDATE_TESTNET_PREF_SUCCESS =
  'settings/SETTINGS_UPDATE_TESTNET_PREF_SUCCESS';

// -- Actions --------------------------------------------------------------- //
export const settingsLoadState = () => async dispatch => {
  try {
    const nativeCurrency = await getNativeCurrency();
    const testnetsEnabled = await getTestnetsEnabled();
    analytics.identify(null, { enabledTestnets: testnetsEnabled });
    analytics.identify(null, { currency: nativeCurrency });


    dispatch({
      payload: { nativeCurrency, testnetsEnabled },
      type: SETTINGS_LOAD_STATE_SUCCESS,
    });
  } catch (error) {
    logger.log('Error loading native currency', error);
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
    logger.log('Error loading network settings', error);
  }
};

export const settingsChangeTestnetsEnabled = testnetsEnabled => async dispatch => {
  dispatch({
    payload: testnetsEnabled,
    type: SETTINGS_UPDATE_TESTNET_PREF_SUCCESS,
  });
  saveTestnetsEnabled(testnetsEnabled);
};

export const settingsUpdateAccountAddress = accountAddress => async dispatch => {
  dispatch({
    payload: accountAddress,
    type: SETTINGS_UPDATE_SETTINGS_ADDRESS,
  });
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
    logger.log('Error updating network settings', error);
  }
};

export const settingsChangeLanguage = language => async dispatch => {
  updateLanguage(language);
  try {
    dispatch({
      payload: language,
      type: SETTINGS_UPDATE_LANGUAGE_SUCCESS,
    });
    saveLanguage(language);
    analytics.identify(null, { language: language });
  } catch (error) {
    logger.log('Error changing language', error);
  }
};

export const settingsChangeNativeCurrency = nativeCurrency => async dispatch => {
  dispatch(dataResetState());
  dispatch(explorerClearState());
  try {
    dispatch({
      payload: nativeCurrency,
      type: SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS,
    });
    dispatch(explorerInit());
    saveNativeCurrency(nativeCurrency);
    analytics.identify(null, { currency: nativeCurrency });
  } catch (error) {
    logger.log('Error changing native currency', error);
  }
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_STATE = {
  accountAddress: '',
  chainId: 1,
  language: 'en',
  nativeCurrency: NativeCurrencyKeys.USD,
  network: networkTypes.mainnet,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SETTINGS_LOAD_STATE_SUCCESS:
      return {
        ...state,
        nativeCurrency: action.payload.nativeCurrency,
        testnetsEnabled: action.payload.testnetsEnabled,
      };
    case SETTINGS_UPDATE_SETTINGS_ADDRESS:
      return {
        ...state,
        accountAddress: action.payload,
      };
    case SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS:
      return {
        ...state,
        nativeCurrency: action.payload,
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
    case SETTINGS_UPDATE_TESTNET_PREF_SUCCESS:
      return {
        ...state,
        testnetsEnabled: action.payload,
      };
    default:
      return state;
  }
};
