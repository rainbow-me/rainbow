import { type Dispatch } from 'redux';

import { analytics } from '@/analytics';
import { Network, type ChainId } from '@/features/network/types/backendNetworks';
import { appSettingsActions } from '@/features/settings/data/appSettingsStore';
import { getChainId, getTestnetsEnabled, saveChainId, saveTestnetsEnabled } from '@/handlers/localstorage/globalSettings';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';

// -- Constants ------------------------------------------------------------- //
const SETTINGS_UPDATE_NETWORK_SUCCESS = 'settings/SETTINGS_UPDATE_NETWORK_SUCCESS';
const SETTINGS_UPDATE_TESTNET_PREF_SUCCESS = 'settings/SETTINGS_UPDATE_TESTNET_PREF_SUCCESS';

// -- Actions --------------------------------------------------------------- //

/**
 * The current `settings` state.
 */
interface SettingsState {
  chainId: number;
  network: Network;
  testnetsEnabled: boolean;
}

/**
 * A `settings` Redux action.
 */
type SettingsStateUpdateAction = SettingsStateUpdateNetworkSuccessAction | SettingsStateUpdateTestnetPrefAction;

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

export const settingsLoadState = () => async (dispatch: Dispatch<SettingsStateUpdateTestnetPrefAction>) => {
  try {
    const nativeCurrency = appSettingsActions.getCurrency();
    const testnetsEnabled = await getTestnetsEnabled();

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
    logger.error(new RainbowError(`[redux/settings]: Error loading testnets preference: ${error}`));
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

export const settingsChangeTestnetsEnabled =
  (testnetsEnabled: boolean) => async (dispatch: Dispatch<SettingsStateUpdateTestnetPrefAction>) => {
    dispatch({
      payload: testnetsEnabled,
      type: SETTINGS_UPDATE_TESTNET_PREF_SUCCESS,
    });
    saveTestnetsEnabled(testnetsEnabled);
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

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_STATE: SettingsState = {
  chainId: 1,
  network: Network.mainnet,
  testnetsEnabled: false,
};

export default (state = INITIAL_STATE, action: SettingsStateUpdateAction) => {
  switch (action.type) {
    case SETTINGS_UPDATE_NETWORK_SUCCESS:
      return {
        ...state,
        chainId: action.payload.chainId,
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
