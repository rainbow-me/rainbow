import AsyncStorage from '@react-native-community/async-storage';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSharedValue } from 'react-native-reanimated';
import DevButton from '../components/dev-buttons/DevButton';
import Emoji from '../components/text/Emoji';
import { showReloadButton, showSwitchModeButton } from '../config/debug';
import { defaultConfig } from '../config/experimental';
import { useTheme } from '../context/ThemeContext';

export const RainbowContext = createContext({});

const EXPERIMENTAL_CONFIG = 'experimentalConfig';

export default function RainbowContextWrapper({ children }: any) {
  // This value is hold here to prevent JS VM from shutting down
  // on unmounting all shared values.
  useSharedValue(0);
  const [config, setConfig] = useState(defaultConfig);
  const [globalState, updateGlobalState] = useState({});

  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '() => Promise<void>' is not assi... Remove this comment to see the full error message
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(async () => {
    const configFromStorage = await AsyncStorage.getItem(EXPERIMENTAL_CONFIG);
    if (configFromStorage) {
      setConfig(config => ({ ...config, ...JSON.parse(configFromStorage) }));
    }
  }, []);

  const setConfigWithStorage = useCallback(newConfig => {
    AsyncStorage.setItem(EXPERIMENTAL_CONFIG, JSON.stringify(newConfig));
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
      // @ts-expect-error ts-migrate(2741) FIXME: Property 'color' is missing in type '{ initialDisp... Remove this comment to see the full error message
      {showReloadButton && __DEV__ && <DevButton initialDisplacement={200} />}
      {showSwitchModeButton && __DEV__ && (
        <DevButton
          color={colors.dark}
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 1.
          onPress={() => setTheme(isDarkMode ? 'light' : 'dark')}
        >
          // @ts-expect-error ts-migrate(2741) FIXME: Property 'name' is missing in type '{ children: st... Remove this comment to see the full error message
          <Emoji>{isDarkMode ? '🌞' : '🌚'}</Emoji>
        </DevButton>
      )}
    </RainbowContext.Provider>
  );
}
