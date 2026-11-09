import { Platform } from 'react-native';

import { changeIcon } from 'react-native-change-icon';
import { type Dispatch } from 'redux';
import { type ThunkDispatch } from 'redux-thunk';

import { analytics } from '@/analytics';
import { Network, type ChainId } from '@/features/network/types/backendNetworks';
import { appSettingsActions } from '@/features/settings/data/appSettingsStore';
import {
  getAppIcon,
  getChainId,
  getLanguage,
  getTestnetsEnabled,
  saveAppIcon,
  saveChainId,
  saveLanguage,
  saveTestnetsEnabled,
} from '@/handlers/localstorage/globalSettings';
import { getProvider } from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { type AppState } from '@/redux/store';

import { Language, updateLanguageLocale } from '../languages';

// -- Constants ------------------------------------------------------------- //
const SETTINGS_UPDATE_APP_ICON_SUCCESS = 'settings/SETTINGS_UPDATE_APP_ICON_SUCCESS';
const SETTINGS_UPDATE_LANGUAGE_SUCCESS = 'settings/SETTINGS_UPDATE_LANGUAGE_SUCCESS';
const SETTINGS_UPDATE_NETWORK_SUCCESS = 'settings/SETTINGS_UPDATE_NETWORK_SUCCESS';
const SETTINGS_UPDATE_TESTNET_PREF_SUCCESS = 'settings/SETTINGS_UPDATE_TESTNET_PREF_SUCCESS';

// -- Actions --------------------------------------------------------------- //

/**
 * The current `settings` state.
 */
interface SettingsState {
  appIcon: string;
  chainId: number;
  language: Language;
  network: Network;
  testnetsEnabled: boolean;
}

/**
 * A `settings` Redux action.
 */
type SettingsStateUpdateAction =
  | SettingsStateUpdateAppIconSuccessAction
  | SettingsStateUpdateNetworkSuccessAction
  | SettingsStateUpdateTestnetPrefAction
  | SettingsStateUpdateLanguageSuccessAction;

interface SettingsStateUpdateAppIconSuccessAction {
  type: typeof SETTINGS_UPDATE_APP_ICON_SUCCESS;
  payload: SettingsState['appIcon'];
}

interface SettingsStateUpdateTestnetPrefAction {
  type: typeof SETTINGS_UPDATE_TESTNET_PREF_SUCCESS;
  payload: SettingsState['testnetsEnabled'];
}

interface SettingsStateUpdateNetworkSuccessAction {
  type: typeof SETTINGS_UPDATE_NETWORK_SUCCESS;
  payload: {
    chainId: SettingsState['chainId'];
  };
}

interface SettingsStateUpdateLanguageSuccessAction {
  type: typeof SETTINGS_UPDATE_LANGUAGE_SUCCESS;
  payload: SettingsState['language'];
}

export const settingsLoadState =
  () =>
  async (dispatch: ThunkDispatch<AppState, unknown, SettingsStateUpdateTestnetPrefAction | SettingsStateUpdateAppIconSuccessAction>) => {
    try {
      const nativeCurrency = appSettingsActions.getCurrency();
      const testnetsEnabled = await getTestnetsEnabled();
      const appIcon = (await getAppIcon()) as string;
      dispatch({
        payload: appIcon,
        type: SETTINGS_UPDATE_APP_ICON_SUCCESS,
      });

      analytics.identify({
        currency: nativeCurrency,
        enabledTestnets: testnetsEnabled,
      });
      // Paired probe. Companion to the installSource probe in App.tsx; see
      // event.debugIdentifyProbe for rationale. Remove after FEPLAT-67 wraps up.
      analytics.track(analytics.event.debugIdentifyProbe, { probe: 'currency', value: String(nativeCurrency) });

      dispatch({
        payload: testnetsEnabled,
        type: SETTINGS_UPDATE_TESTNET_PREF_SUCCESS,
      });
    } catch (error) {
      logger.error(new RainbowError(`[redux/settings]: Error loading app icon and testnets pref: ${error}`));
    }
  };

export const settingsLoadNetwork = () => async (dispatch: Dispatch<SettingsStateUpdateNetworkSuccessAction>) => {
  try {
    const chainId = await getChainId();
    getProvider({ chainId });
    dispatch({
      payload: { chainId },
      type: SETTINGS_UPDATE_NETWORK_SUCCESS,
    });
  } catch (error) {
    logger.error(new RainbowError(`[redux/settings]: Error loading network settings: ${error}`));
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
    logger.error(new RainbowError(`[redux/settings]: Error loading language settings: ${error}`));
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
    logger.debug(`[redux/settings]: changing app icon to ${appIcon}`);
    try {
      await changeIcon(appIcon);
      logger.debug(`[redux/settings]: icon changed to ${appIcon}`);
      saveAppIcon(appIcon);
      dispatch({
        payload: appIcon,
        type: SETTINGS_UPDATE_APP_ICON_SUCCESS,
      });
    } catch (error) {
      logger.error(new RainbowError(`[redux/settings]: Error changing app icon: ${error}`));
    }
  };

  if (Platform.OS === 'android') {
    Alert.alert(i18n.t(i18n.l.settings.icon_change.title), i18n.t(i18n.l.settings.icon_change.warning), [
      {
        onPress: () => {},
        text: i18n.t(i18n.l.settings.icon_change.cancel),
      },
      {
        onPress: callback,
        text: i18n.t(i18n.l.settings.icon_change.confirm),
      },
    ]);
  } else {
    callback();
  }
};

export const settingsUpdateNetwork = (chainId: ChainId) => async (dispatch: Dispatch<SettingsStateUpdateNetworkSuccessAction>) => {
  getProvider({ chainId });
  try {
    dispatch({
      payload: { chainId },
      type: SETTINGS_UPDATE_NETWORK_SUCCESS,
    });
    saveChainId(chainId);
  } catch (error) {
    logger.error(new RainbowError(`[redux/settings]: Error updating network settings: ${error}`));
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
    logger.error(new RainbowError(`[redux/settings]: Error changing language: ${error}`));
  }
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_STATE: SettingsState = {
  appIcon: 'og',
  chainId: 1,
  language: Language.EN_US,
  network: Network.mainnet,
  testnetsEnabled: false,
};

export default (state = INITIAL_STATE, action: SettingsStateUpdateAction) => {
  switch (action.type) {
    case SETTINGS_UPDATE_APP_ICON_SUCCESS:
      return {
        ...state,
        appIcon: action.payload,
      };
    case SETTINGS_UPDATE_NETWORK_SUCCESS:
      return {
        ...state,
        chainId: action.payload.chainId,
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
