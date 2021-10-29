import analytics from '@segment/analytics-react-native';
import { updateLanguage } from '../languages';
import { NativeCurrencyKeys } from '@rainbow-me/entities';
import {
  getNativeCurrency,
  getNetwork,
  saveLanguage,
  saveNativeCurrency,
  saveNetwork,
} from '@rainbow-me/handlers/localstorage/globalSettings';
import { web3SetHttpProvider } from '@rainbow-me/handlers/web3';
import networkTypes, { Network } from '@rainbow-me/helpers/networkTypes';
import { dataResetState } from '@rainbow-me/redux/data';
import { explorerClearState, explorerInit } from '@rainbow-me/redux/explorer';
import { AppDispatch } from '@rainbow-me/redux/store';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

// -- Constants ------------------------------------------------------------- //
const SETTINGS_UPDATE_SETTINGS_ADDRESS =
  'settings/SETTINGS_UPDATE_SETTINGS_ADDRESS';
const SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS =
  'settings/SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS';
const SETTINGS_UPDATE_LANGUAGE_SUCCESS =
  'settings/SETTINGS_UPDATE_LANGUAGE_SUCCESS';
const SETTINGS_UPDATE_NETWORK_SUCCESS =
  'settings/SETTINGS_UPDATE_NETWORK_SUCCESS';

// -- Actions --------------------------------------------------------------- //

/**
 * The current `settings` state.
 */
interface SettingsState {
  accountAddress: string;
  chainId: number;
  language: string;
  nativeCurrency: string;
  network: Network;
}

/**
 * A `settings` Redux action.
 */
type SettingsStateUpdateAction =
  | SettingsStateUpdateSettingsAddressAction
  | SettingsStateUpdateNativeCurrencySuccessAction
  | SettingsStateUpdateNetworkSuccessAction
  | SettingsStateUpdateLanguageSuccessAction;

interface SettingsStateUpdateSettingsAddressAction {
  type: typeof SETTINGS_UPDATE_SETTINGS_ADDRESS;
  payload: SettingsState['accountAddress'];
}

interface SettingsStateUpdateNativeCurrencySuccessAction {
  type: typeof SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS;
  payload: SettingsState['nativeCurrency'];
}

interface SettingsStateUpdateNetworkSuccessAction {
  type: typeof SETTINGS_UPDATE_NETWORK_SUCCESS;
  payload: {
    chainId: SettingsState['chainId'];
    network: SettingsState['network'];
  };
}

interface SettingsStateUpdateLanguageSuccessAction {
  type: typeof SETTINGS_UPDATE_LANGUAGE_SUCCESS;
  payload: SettingsState['language'];
}

export const settingsLoadState = () => async (dispatch: AppDispatch) => {
  try {
    const nativeCurrency = await getNativeCurrency();
    analytics.identify(null, { currency: nativeCurrency });

    dispatch({
      payload: nativeCurrency,
      type: SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS,
    });
  } catch (error) {
    logger.log('Error loading native currency', error);
  }
};

export const settingsLoadNetwork = () => async (dispatch: AppDispatch) => {
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

export const settingsUpdateAccountAddress = (accountAddress: string) => async (
  dispatch: AppDispatch
) => {
  dispatch({
    payload: accountAddress,
    type: SETTINGS_UPDATE_SETTINGS_ADDRESS,
  });
};

export const settingsUpdateNetwork = (network: Network) => async (
  dispatch: AppDispatch
) => {
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

export const settingsChangeLanguage = (language: string) => async (
  dispatch: AppDispatch
) => {
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

export const settingsChangeNativeCurrency = (nativeCurrency: string) => async (
  dispatch: AppDispatch
) => {
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
export const INITIAL_STATE: SettingsState = {
  accountAddress: '',
  chainId: 1,
  language: 'en',
  nativeCurrency: NativeCurrencyKeys.USD,
  network: networkTypes.mainnet,
};

export default (state = INITIAL_STATE, action: SettingsStateUpdateAction) => {
  switch (action.type) {
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
    default:
      return state;
  }
};
