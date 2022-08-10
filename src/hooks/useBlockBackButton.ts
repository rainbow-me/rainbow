import { useEffect } from 'react';
import { NativeModules } from 'react-native';

const { RNBackHandler } = NativeModules;

export function useBlockBackButton(block: boolean) {
  useEffect(() => {
    if (!block) {
      return;
    }
    RNBackHandler.setBlockBackButton(true);
    return () => RNBackHandler.setBlockBackButton(false);
  }, []);
}
