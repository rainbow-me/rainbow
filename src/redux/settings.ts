import analytics from '@segment/analytics-react-native';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { updateLanguageLocale } from '../languages';
import { NativeCurrencyKeys } from '@rainbow-me/entities';
import {
  getLanguage,
  getNativeCurrency,
  getNetwork,
  getTestnetsEnabled,
  saveLanguage,
  saveNativeCurrency,
  saveNetwork,
  saveTestnetsEnabled,
} from '@rainbow-me/handlers/localstorage/globalSettings';
import { web3SetHttpProvider } from '@rainbow-me/handlers/web3';
import { Network } from '@rainbow-me/helpers/networkTypes';
import { dataResetState } from '@rainbow-me/redux/data';
import { explorerClearState, explorerInit } from '@rainbow-me/redux/explorer';
import { AppState } from '@rainbow-me/redux/store';
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
const SETTINGS_UPDATE_TESTNET_PREF_SUCCESS =
  'settings/SETTINGS_UPDATE_TESTNET_PREF_SUCCESS';

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
  testnetsEnabled: boolean;
}

/**
 * A `settings` Redux action.
 */
type SettingsStateUpdateAction =
  | SettingsStateUpdateSettingsAddressAction
  | SettingsStateUpdateNativeCurrencySuccessAction
  | SettingsStateUpdateNetworkSuccessAction
  | SettingsStateUpdateTestnetPrefAction
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

interface SettingsStateUpdateTestnetPrefAction {
  type: typeof SETTINGS_UPDATE_TESTNET_PREF_SUCCESS;
  payload: SettingsState['testnetsEnabled'];
}

interface SettingsStateUpdateLanguageSuccessAction {
  type: typeof SETTINGS_UPDATE_LANGUAGE_SUCCESS;
  payload: SettingsState['language'];
}

export const settingsLoadState = () => async (
  dispatch: Dispatch<SettingsStateUpdateNativeCurrencySuccessAction>
) => {
  try {
    const nativeCurrency = await getNativeCurrency();
    const testnetsEnabled = await getTestnetsEnabled();
    analytics.identify(null, {
      currency: nativeCurrency,
      enabledTestnets: testnetsEnabled,
    });

    dispatch({
      payload: nativeCurrency,
      type: SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS,
    });
  } catch (error) {
    logger.log('Error loading native currency', error);
  }
};

export const settingsLoadNetwork = () => async (
  dispatch: Dispatch<SettingsStateUpdateNetworkSuccessAction>
) => {
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

export const settingsLoadTestnetsEnabled = () => async (
  dispatch: Dispatch<SettingsStateUpdateTestnetPrefAction>
) => {
  try {
    const testnetsEnabled = await getTestnetsEnabled();
    analytics.identify(null, {
      enabledTestnets: testnetsEnabled,
    });

    dispatch({
      payload: testnetsEnabled,
      type: SETTINGS_UPDATE_TESTNET_PREF_SUCCESS,
    });
  } catch (error) {
    logger.log('Error loading testnetsEnabled', error);
  }
};
export const settingsChangeTestnetsEnabled = (testnetsEnabled: any) => async (
  dispatch: Dispatch<SettingsStateUpdateTestnetPrefAction>
) => {
  dispatch({
    payload: testnetsEnabled,
    type: SETTINGS_UPDATE_TESTNET_PREF_SUCCESS,
  });
  saveTestnetsEnabled(testnetsEnabled);
};

export const settingsLoadLanguage = () => async (
  dispatch: Dispatch<SettingsStateUpdateLanguageSuccessAction>
) => {
  try {
    const language = await getLanguage();
    updateLanguageLocale(language);
    dispatch({
      payload: language,
      type: SETTINGS_UPDATE_LANGUAGE_SUCCESS,
    });
  } catch (error) {
    logger.log('Error loading language settings', error);
  }
};

export const settingsUpdateAccountAddress = (accountAddress: string) => async (
  dispatch: Dispatch<SettingsStateUpdateSettingsAddressAction>
) => {
  dispatch({
    payload: accountAddress,
    type: SETTINGS_UPDATE_SETTINGS_ADDRESS,
  });
};

export const settingsUpdateNetwork = (network: Network) => async (
  dispatch: Dispatch<SettingsStateUpdateNetworkSuccessAction>
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
  dispatch: Dispatch<SettingsStateUpdateLanguageSuccessAction>
) => {
  updateLanguageLocale(language);
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
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    SettingsStateUpdateNativeCurrencySuccessAction
  >
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
  network: Network.mainnet,
  testnetsEnabled: false,
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
    case SETTINGS_UPDATE_TESTNET_PREF_SUCCESS:
      return {
        ...state,
        testnetsEnabled: action.payload,
      };
    default:
      return state;
  }
};
