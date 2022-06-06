import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { MMKV } from 'react-native-mmkv';
import { useSharedValue } from 'react-native-reanimated';
import DevButton from '../components/dev-buttons/DevButton';
import Emoji from '../components/text/Emoji';
import { showReloadButton, showSwitchModeButton } from '../config/debug';
import { defaultConfig } from '../config/experimental';
import { useTheme } from '../theme/ThemeContext';
import { STORAGE_IDS } from '@rainbow-me/model/mmkv';

export const RainbowContext = createContext({});
const storageKey = 'config';

const storage = new MMKV({
  id: STORAGE_IDS.EXPERIMENTAL_CONFIG,
});

export default function RainbowContextWrapper({ children }) {
  // This value is hold here to prevent JS VM from shutting down
  // on unmounting all shared values.
  useSharedValue(0);
  const [config, setConfig] = useState(
    Object.entries(defaultConfig).reduce(
      (acc, [key, { value }]) => ({ ...acc, [key]: value }),
      {}
    )
  );
  const [globalState, updateGlobalState] = useState({});

  useEffect(() => {
    const configFromStorage = storage.getString(storageKey);
    if (configFromStorage) {
      setConfig(config => ({ ...config, ...JSON.parse(configFromStorage) }));
    }
  }, []);

  const setConfigWithStorage = useCallback(newConfig => {
    storage.set(storageKey, JSON.stringify(newConfig));
    setConfig(newConfig);
  }, []);

  const setGlobalState = useCallback(
    newState => updateGlobalState(prev => ({ ...prev, ...(newState || {}) })),
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
      {showReloadButton && __DEV__ && <DevButton initialDisplacement={200} />}
      {showSwitchModeButton && __DEV__ && (
        <DevButton
          color={colors.dark}
          onPress={() => setTheme(isDarkMode ? 'light' : 'dark')}
        >
          <Emoji>{isDarkMode ? '🌞' : '🌚'}</Emoji>
        </DevButton>
      )}
    </RainbowContext.Provider>
  );
}
