// @ts-ignore
import { changeIcon } from 'react-native-change-icon';
import lang from 'i18n-js';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { Language, updateLanguageLocale } from '../languages';
import { analyticsV2 as analytics } from '@/analytics';
import { NativeCurrencyKey, NativeCurrencyKeys } from '@/entities';
import { WrappedAlert as Alert } from '@/helpers/alert';

import {
  getAppIcon,
  getFlashbotsEnabled,
  getLanguage,
  getNativeCurrency,
  getNetwork,
  getTestnetsEnabled,
  saveAppIcon,
  saveFlashbotsEnabled,
  saveLanguage,
  saveNativeCurrency,
  saveNetwork,
  saveTestnetsEnabled,
} from '@/handlers/localstorage/globalSettings';
import { web3SetHttpProvider } from '@/handlers/web3';
import { Network } from '@/helpers/networkTypes';
import { explorerClearState, explorerInit } from '@/redux/explorer';
import { AppState } from '@/redux/store';
import { ethereumUtils } from '@/utils';
import logger from '@/utils/logger';

// -- Constants ------------------------------------------------------------- //
const SETTINGS_UPDATE_SETTINGS_ADDRESS = 'settings/SETTINGS_UPDATE_SETTINGS_ADDRESS';
const SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS = 'settings/SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS';
const SETTINGS_UPDATE_APP_ICON_SUCCESS = 'settings/SETTINGS_UPDATE_APP_ICON_SUCCESS';
const SETTINGS_UPDATE_LANGUAGE_SUCCESS = 'settings/SETTINGS_UPDATE_LANGUAGE_SUCCESS';
const SETTINGS_UPDATE_NETWORK_SUCCESS = 'settings/SETTINGS_UPDATE_NETWORK_SUCCESS';
const SETTINGS_UPDATE_TESTNET_PREF_SUCCESS = 'settings/SETTINGS_UPDATE_TESTNET_PREF_SUCCESS';
const SETTINGS_UPDATE_FLASHBOTS_PREF_SUCCESS = 'settings/SETTINGS_UPDATE_FLASHBOTS_PREF_SUCCESS';
const SETTINGS_UPDATE_ACCOUNT_SETTINGS_SUCCESS = 'settings/SETTINGS_UPDATE_ACCOUNT_SETTINGS_SUCCESS';

// -- Actions --------------------------------------------------------------- //

/**
 * The current `settings` state.
 */
interface SettingsState {
  appIcon: string;
  accountAddress: string;
  chainId: number;
  flashbotsEnabled: boolean;
  language: Language;
  nativeCurrency: NativeCurrencyKey;
  network: Network;
  testnetsEnabled: boolean;
}

/**
 * A `settings` Redux action.
 */
type SettingsStateUpdateAction =
  | SettingsStateUpdateSettingsAddressAction
  | SettingsStateUpdateNativeCurrencySuccessAction
  | SettingsStateUpdateAppIconSuccessAction
  | SettingsStateUpdateNetworkSuccessAction
  | SettingsStateUpdateTestnetPrefAction
  | SettingsStateUpdateFlashbotsPrefAction
  | SettingsStateUpdateNativeCurrencyAndTestnetsSuccessAction
  | SettingsStateUpdateLanguageSuccessAction;

interface SettingsStateUpdateSettingsAddressAction {
  type: typeof SETTINGS_UPDATE_SETTINGS_ADDRESS;
  payload: SettingsState['accountAddress'];
}

interface SettingsStateUpdateNativeCurrencySuccessAction {
  type: typeof SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS;
  payload: SettingsState['nativeCurrency'];
}
interface SettingsStateUpdateAppIconSuccessAction {
  type: typeof SETTINGS_UPDATE_APP_ICON_SUCCESS;
  payload: SettingsState['appIcon'];
}

interface SettingsStateUpdateNativeCurrencyAndTestnetsSuccessAction {
  type: typeof SETTINGS_UPDATE_ACCOUNT_SETTINGS_SUCCESS;
  payload: {
    nativeCurrency: SettingsState['nativeCurrency'];
    testnetsEnabled: SettingsState['testnetsEnabled'];
    flashbotsEnabled: SettingsState['flashbotsEnabled'];
  };
}

interface SettingsStateUpdateTestnetPrefAction {
  type: typeof SETTINGS_UPDATE_TESTNET_PREF_SUCCESS;
  payload: SettingsState['testnetsEnabled'];
}

interface SettingsStateUpdateFlashbotsPrefAction {
  type: typeof SETTINGS_UPDATE_FLASHBOTS_PREF_SUCCESS;
  payload: SettingsState['flashbotsEnabled'];
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

export const settingsLoadState =
  () =>
  async (
    dispatch: ThunkDispatch<
      AppState,
      unknown,
      SettingsStateUpdateNativeCurrencyAndTestnetsSuccessAction | SettingsStateUpdateAppIconSuccessAction
    >
  ) => {
    try {
      const nativeCurrency = await getNativeCurrency();
      const testnetsEnabled = await getTestnetsEnabled();
      const appIcon = (await getAppIcon()) as string;
      dispatch({
        payload: appIcon,
        type: SETTINGS_UPDATE_APP_ICON_SUCCESS,
      });

      const flashbotsEnabled = await getFlashbotsEnabled();

      analytics.identify({
        currency: nativeCurrency,
        enabledFlashbots: flashbotsEnabled,
        enabledTestnets: testnetsEnabled,
      });

      dispatch({
        payload: { flashbotsEnabled, nativeCurrency, testnetsEnabled },
        type: SETTINGS_UPDATE_ACCOUNT_SETTINGS_SUCCESS,
      });
    } catch (error) {
      logger.log('Error loading native currency and testnets pref', error);
    }
  };

export const settingsLoadNetwork = () => async (dispatch: Dispatch<SettingsStateUpdateNetworkSuccessAction>) => {
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

export const settingsLoadLanguage = () => async (dispatch: Dispatch<SettingsStateUpdateLanguageSuccessAction>) => {
  try {
    const language = await getLanguage();
    updateLanguageLocale(language as Language);
    dispatch({
      payload: language,
      type: SETTINGS_UPDATE_LANGUAGE_SUCCESS,
    });
    analytics.identify({
      language,
    });
  } catch (error) {
    logger.log('Error loading language settings', error);
  }
};

export const settingsChangeTestnetsEnabled =
  (testnetsEnabled: boolean) => async (dispatch: Dispatch<SettingsStateUpdateTestnetPrefAction>) => {
    dispatch({
      payload: testnetsEnabled,
      type: SETTINGS_UPDATE_TESTNET_PREF_SUCCESS,
    });
    saveTestnetsEnabled(testnetsEnabled);
  };

export const settingsChangeAppIcon = (appIcon: string) => (dispatch: Dispatch<SettingsStateUpdateAppIconSuccessAction>) => {
  const callback = async () => {
    logger.log('changing app icon to', appIcon);
    try {
      await changeIcon(appIcon);
      logger.log('icon changed to ', appIcon);
      saveAppIcon(appIcon);
      dispatch({
        payload: appIcon,
        type: SETTINGS_UPDATE_APP_ICON_SUCCESS,
      });
    } catch (error) {
      logger.log('Error changing app icon', error);
    }
  };

  if (android) {
    Alert.alert(lang.t('settings.icon_change.title'), lang.t('settings.icon_change.warning'), [
      {
        onPress: () => {},
        text: lang.t('settings.icon_change.cancel'),
      },
      {
        onPress: callback,
        text: lang.t('settings.icon_change.confirm'),
      },
    ]);
  } else {
    callback();
  }
};

export const settingsChangeFlashbotsEnabled =
  (flashbotsEnabled: boolean) => async (dispatch: Dispatch<SettingsStateUpdateFlashbotsPrefAction>) => {
    dispatch({
      payload: flashbotsEnabled,
      type: SETTINGS_UPDATE_FLASHBOTS_PREF_SUCCESS,
    });
    saveFlashbotsEnabled(flashbotsEnabled);
  };

export const settingsUpdateAccountAddress =
  (accountAddress: string) => async (dispatch: Dispatch<SettingsStateUpdateSettingsAddressAction>) => {
    dispatch({
      payload: accountAddress,
      type: SETTINGS_UPDATE_SETTINGS_ADDRESS,
    });
  };

export const settingsUpdateNetwork = (network: Network) => async (dispatch: Dispatch<SettingsStateUpdateNetworkSuccessAction>) => {
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

export const settingsChangeLanguage = (language: Language) => async (dispatch: Dispatch<SettingsStateUpdateLanguageSuccessAction>) => {
  updateLanguageLocale(language);
  try {
    dispatch({
      payload: language,
      type: SETTINGS_UPDATE_LANGUAGE_SUCCESS,
    });
    saveLanguage(language);
    analytics.identify({ language });
  } catch (error) {
    logger.log('Error changing language', error);
  }
};

export const settingsChangeNativeCurrency =
  (nativeCurrency: NativeCurrencyKey) =>
  async (dispatch: ThunkDispatch<AppState, unknown, SettingsStateUpdateNativeCurrencySuccessAction>) => {
    dispatch(explorerClearState());
    try {
      dispatch({
        payload: nativeCurrency,
        type: SETTINGS_UPDATE_NATIVE_CURRENCY_SUCCESS,
      });
      dispatch(explorerInit());
      saveNativeCurrency(nativeCurrency);
      analytics.identify({ currency: nativeCurrency });
    } catch (error) {
      logger.log('Error changing native currency', error);
    }
  };

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_STATE: SettingsState = {
  accountAddress: '',
  appIcon: 'og',
  chainId: 1,
  flashbotsEnabled: false,
  language: Language.EN_US,
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
    case SETTINGS_UPDATE_APP_ICON_SUCCESS:
      return {
        ...state,
        appIcon: action.payload,
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
    case SETTINGS_UPDATE_ACCOUNT_SETTINGS_SUCCESS:
      return {
        ...state,
        flashbotsEnabled: action.payload.flashbotsEnabled,
        nativeCurrency: action.payload.nativeCurrency,
        testnetsEnabled: action.payload.testnetsEnabled,
      };
    case SETTINGS_UPDATE_TESTNET_PREF_SUCCESS:
      return {
        ...state,
        testnetsEnabled: action.payload,
      };
    case SETTINGS_UPDATE_FLASHBOTS_PREF_SUCCESS:
      return {
        ...state,
        flashbotsEnabled: action.payload,
      };
    default:
      return state;
  }
};
