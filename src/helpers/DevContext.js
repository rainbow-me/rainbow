import AsyncStorage from '@react-native-community/async-storage';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { defaultConfig } from '../config/experimental';

export const DevContext = createContext({});

const EXPERIMENTAL_CONFIG = 'experimentalConfig';

function DevContextComponent({ children }) {
  const [config, setConfig] = useState(defaultConfig);

  useEffect(async () => {
    const configFromStorage = await AsyncStorage.getItem(EXPERIMENTAL_CONFIG);
    if (configFromStorage) {
      setConfig(JSON.parse(configFromStorage));
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
  if (!__DEV__) {
    return children;
  }
  return <DevContextComponent>{children}</DevContextComponent>;
}
