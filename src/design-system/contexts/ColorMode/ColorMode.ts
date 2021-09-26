import { createContext, useCallback, useContext } from 'react';

type ColorMode = 'lightMode' | 'darkMode';
const ColorModeContext = createContext<ColorMode>('lightMode');

export const ColorModeProvider = ColorModeContext.Provider;
export const useColorMode = () => useContext(ColorModeContext);

type ColorModeValue<Value extends string | number> =
  | Value
  | { lightMode: Value; darkMode: Value };

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
