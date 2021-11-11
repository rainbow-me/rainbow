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

/**
 * @description Sets the color mode for nested elements so they can correctly
 * infer whether they are in a dark or light context. The `"dark"` and
 * `"light"` color modes are pretty self explanatory, and the `"darkTinted"`
 * color mode is designed for screens that are colored based on user content,
 * meaning that some foreground elements will need to be desaturated.
 */
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
