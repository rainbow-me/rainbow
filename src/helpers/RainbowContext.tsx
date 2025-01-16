import React, { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { MMKV } from 'react-native-mmkv';
import { useSharedValue } from 'react-native-reanimated';
import DevButton from '../components/dev-buttons/DevButton';
import Emoji from '../components/text/Emoji';
import { showReloadButton, showSwitchModeButton, showConnectToAnvilButton } from '../config/debug';
import { defaultConfig } from '@/config/experimental';
import { useDispatch } from 'react-redux';

import { useTheme } from '../theme/ThemeContext';
import { STORAGE_IDS } from '@/model/mmkv';
import { logger, RainbowError } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { IS_TEST } from '@/env';

export type RainbowContextType = {
  config: Record<keyof typeof defaultConfig, boolean>;
  setConfig: (newConfig: Record<string, boolean>) => void;
  setGlobalState: (newState: any) => void;
};

export const RainbowContext = createContext<RainbowContextType>({
  config: {},
  setConfig: () => {},
  setGlobalState: () => {},
});

const storageKey = 'config';

const storage = new MMKV({
  id: STORAGE_IDS.EXPERIMENTAL_CONFIG,
});

export default function RainbowContextWrapper({ children }: PropsWithChildren) {
  // This value is hold here to prevent JS VM from shutting down
  // on unmounting all shared values.
  useSharedValue(0);
  const { setConnectedToAnvil } = useConnectedToAnvilStore();
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

  const connectToAnvil = useCallback(async () => {
    try {
      setConnectedToAnvil(true);
      logger.debug('connected to anvil');
    } catch (e: any) {
      setConnectedToAnvil(false);
      logger.error(new RainbowError('error connecting to anvil'), {
        message: e.message,
      });
    }
    Navigation.handleAction(Routes.WALLET_SCREEN, {});
  }, [dispatch, setConnectedToAnvil]);

  return (
    <RainbowContext.Provider value={initialValue}>
      {children}
      {/* @ts-expect-error ts-migrate(2741) FIXME: Property 'color' is missing in type... Remove this comment to see the full error message */}
      {showReloadButton && __DEV__ && <DevButton initialDisplacement={200} />}
      {((showConnectToAnvilButton && __DEV__) || IS_TEST) && (
        <DevButton color={colors.purple} onPress={connectToAnvil} initialDisplacement={150} testID={'dev-button-anvil'} size={20}>
          {/* @ts-ignore */}
          <Emoji>👷</Emoji>
        </DevButton>
      )}
      {showSwitchModeButton && __DEV__ && (
        <DevButton color={colors.dark} onPress={() => setTheme(isDarkMode ? 'light' : 'dark')}>
          <Emoji>{isDarkMode ? '🌞' : '🌚'}</Emoji>
        </DevButton>
      )}
    </RainbowContext.Provider>
  );
}
