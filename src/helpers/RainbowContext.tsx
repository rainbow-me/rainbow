import React, { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { MMKV } from 'react-native-mmkv';
import { useSharedValue } from 'react-native-reanimated';
import DevButton from '../components/dev-buttons/DevButton';
import Emoji from '../components/text/Emoji';
import { showReloadButton, showSwitchModeButton, showConnectToHardhatButton } from '../config/debug';
import { defaultConfig } from '../config/experimental';
import { useDispatch } from 'react-redux';

import { useTheme } from '../theme/ThemeContext';
import { STORAGE_IDS } from '@/model/mmkv';
import { IS_TESTING } from 'react-native-dotenv';
import { logger, RainbowError } from '@/logger';
import { explorerInit } from '@/redux/explorer';
import { Navigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import { connectedToHardhatStore } from '@/state/connectedToHardhat';

export const RainbowContext = createContext({});
const storageKey = 'config';

const storage = new MMKV({
  id: STORAGE_IDS.EXPERIMENTAL_CONFIG,
});

export default function RainbowContextWrapper({ children }: PropsWithChildren) {
  // This value is hold here to prevent JS VM from shutting down
  // on unmounting all shared values.
  useSharedValue(0);
  const setConnectedToHardhat = connectedToHardhatStore.getState().setConnectedToHardhat;
  const [config, setConfig] = useState<Record<string, boolean>>(
    Object.entries(defaultConfig).reduce((acc, [key, { value }]) => ({ ...acc, [key]: value }), {})
  );
  const [globalState, updateGlobalState] = useState({});

  useEffect(() => {
    const configFromStorage = storage.getString(storageKey);
    if (configFromStorage) {
      setConfig(config => ({ ...config, ...JSON.parse(configFromStorage) }));
    }
  }, []);

  const setConfigWithStorage = useCallback((newConfig: Record<string, boolean>) => {
    storage.set(storageKey, JSON.stringify(newConfig));
    setConfig(newConfig);
  }, []);

  const setGlobalState = useCallback((newState: any) => updateGlobalState(prev => ({ ...prev, ...(newState || {}) })), [updateGlobalState]);

  const initialValue = useMemo(
    () => ({
      ...globalState,
      config,
      setConfig: setConfigWithStorage,
      setGlobalState,
    }),
    [config, globalState, setConfigWithStorage, setGlobalState]
  );

  const { isDarkMode, setTheme, colors } = useTheme();

  const dispatch = useDispatch();

  const connectToHardhat = useCallback(async () => {
    try {
      setConnectedToHardhat(true);
      logger.debug('connected to hardhat');
    } catch (e: any) {
      setConnectedToHardhat(false);
      logger.error(new RainbowError('error connecting to hardhat'), {
        message: e.message,
      });
    }
    dispatch(explorerInit());
    Navigation.handleAction(Routes.WALLET_SCREEN, {});
  }, [dispatch, setConnectedToHardhat]);

  return (
    <RainbowContext.Provider value={initialValue}>
      {children}
      {/* @ts-expect-error ts-migrate(2741) FIXME: Property 'color' is missing in type... Remove this comment to see the full error message */}
      {showReloadButton && __DEV__ && <DevButton initialDisplacement={200} />}
      {((showConnectToHardhatButton && __DEV__) || IS_TESTING === 'true') && (
        <DevButton color={colors.purple} onPress={connectToHardhat} initialDisplacement={150} testID={'dev-button-hardhat'} size={20}>
          {/* @ts-ignore */}
          <Emoji>👷</Emoji>
        </DevButton>
      )}
      {showSwitchModeButton && __DEV__ && (
        <DevButton color={colors.dark} onPress={() => setTheme(isDarkMode ? 'light' : 'dark')}>
          {/* @ts-expect-error ts-migrate(2741) FIXME: Property 'name' is missing in type... Remove this comment to see the full error message */}
          <Emoji>{isDarkMode ? '🌞' : '🌚'}</Emoji>
        </DevButton>
      )}
    </RainbowContext.Provider>
  );
}
