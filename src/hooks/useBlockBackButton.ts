import { useEffect } from 'react';
import { NativeModules } from 'react-native';

const { RNBackHandler } = NativeModules;

export function useBlockBackButton() {
  useEffect(() => {
    RNBackHandler.setBlockBackButton(true);
    return () => RNBackHandler.setBlockBackButton(false);
  }, []);
}
