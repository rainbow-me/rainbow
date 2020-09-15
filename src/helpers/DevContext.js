import AsyncStorage from '@react-native-community/async-storage';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { defaultConfig } from '../config/experimental';

export const DevContext = createContext({});

const EXPERIMENTAL_CONFIG = 'experimentalConfig';

function DevContextComponent({ children }) {
  // This value is hold here to prevent JS VM from shutting down
  // on unmounting all shared values.
  useSharedValue(0, 'DevContextComponent');
  const [config, setConfig] = useState(defaultConfig);

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
  const value = useMemo(
    () => ({
      config,
      setConfig: setConfigWithStorage,
    }),
    [config, setConfigWithStorage]
  );
  return <DevContext.Provider value={value}>{children}</DevContext.Provider>;
}

export default function DevContextWrapper({ children }) {
  if (!IS_DEV) {
    return children;
  }
  return <DevContextComponent>{children}</DevContextComponent>;
}
