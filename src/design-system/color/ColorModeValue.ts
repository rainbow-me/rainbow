import { useCallback } from 'react';
import { ColorMode, useColorMode } from './ColorMode';

export type ColorModeValue<Value extends string | number> =
  | Value
  | Record<ColorMode, Value>;

export const useColorModeValue = () => {
  const colorMode = useColorMode();

  return useCallback(
    <Value extends string | number>(value: ColorModeValue<Value>) => {
      if (typeof value === 'object') {
        return value[colorMode];
      }

      return value;
    },
    [colorMode]
  );
};
