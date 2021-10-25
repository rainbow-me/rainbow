import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { ColorMode, Palette, palettes } from './palettes';

function contextValueForColorMode(colorMode: ColorMode): ColorModeContextValue {
  return {
    colorMode,
    ...palettes[colorMode],
  };
}

export const ColorModeContext = createContext<ColorModeContextValue>(
  contextValueForColorMode('light')
);

interface ColorModeContextValue extends Palette {
  colorMode: ColorMode;
}

export function ColorModeProvider({
  value: colorMode,
  children,
}: {
  value: ColorMode;
  children: ReactNode;
}) {
  return (
    <ColorModeContext.Provider
      value={useMemo(() => contextValueForColorMode(colorMode), [colorMode])}
    >
      {children}
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);
