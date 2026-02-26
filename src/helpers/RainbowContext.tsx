import React, { createContext, type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { createMMKV } from 'react-native-mmkv';
import { useSharedValue } from 'react-native-reanimated';
import DevButton from '../components/dev-buttons/DevButton';
import Emoji from '../components/text/Emoji';
import { showReloadButton, showSwitchModeButton } from '../config/debug';
import { type defaultConfig, defaultConfigValues } from '@/config/experimental';
import { useTheme } from '../theme/ThemeContext';
import { STORAGE_IDS } from '@/model/mmkv';
import { IS_DEV, IS_TEST } from '@/env';
import { getFavorites } from '@/resources/favorites';

export type RainbowContextType = {
  config: Record<keyof typeof defaultConfig, boolean> | Record<string, never>;
  setConfig: (newConfig: Record<string, boolean>) => void;
  setGlobalState: (newState: Record<string, unknown>) => void;
};

export const RainbowContext = createContext<RainbowContextType>({
  config: {},
  setConfig: () => {
    return;
  },
  setGlobalState: () => {
    return;
  },
});

const storageKey = 'config';

const storage = createMMKV({
  id: STORAGE_IDS.EXPERIMENTAL_CONFIG,
});

// eslint-disable-next-line import/no-default-export
export default function RainbowContextWrapper({ children }: PropsWithChildren) {
  // This value is hold here to prevent JS VM from shutting down
  // on unmounting all shared values.
  useSharedValue(0);
  const [config, setConfig] = useState<Record<string, boolean>>(defaultConfigValues);
  const [globalState, updateGlobalState] = useState({});

  useEffect(() => {
    if (IS_TEST) {
      getFavorites();
    }
    const configFromStorage = storage.getString(storageKey);
    if (configFromStorage) {
      setConfig(config => ({ ...config, ...JSON.parse(configFromStorage) }));
    }
  }, []);

  const setConfigWithStorage = useCallback((newConfig: Record<string, boolean>) => {
    storage.set(storageKey, JSON.stringify(newConfig));
    setConfig(newConfig);
  }, []);

  const setGlobalState = useCallback(
    (newState: Record<string, unknown>) => updateGlobalState(prev => ({ ...prev, ...(newState || {}) })),
    [updateGlobalState]
  );

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

  return (
    <RainbowContext.Provider value={initialValue}>
      {children}
      {showReloadButton && IS_DEV && <DevButton color={colors.red} initialDisplacement={200} />}
      {showSwitchModeButton && IS_DEV && (
        <DevButton color={colors.dark} onPress={() => setTheme(isDarkMode ? 'light' : 'dark')}>
          <Emoji>{isDarkMode ? '🌞' : '🌚'}</Emoji>
        </DevButton>
      )}
    </RainbowContext.Provider>
  );
}
