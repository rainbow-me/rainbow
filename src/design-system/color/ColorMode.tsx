import React, { createContext, ReactNode, useMemo } from 'react';
import { ColorMode, ContextualPalette, contextualPalettes } from './palette';

function contextValueForColorMode(colorMode: ColorMode): ColorModeContextValue {
  return {
    colorMode,
    contextualPalette: contextualPalettes[colorMode],
  };
}

export const ColorModeContext = createContext<ColorModeContextValue>(
  contextValueForColorMode('light')
);

interface ColorModeContextValue {
  colorMode: ColorMode;
  contextualPalette: ContextualPalette;
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
