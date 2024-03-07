import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { ColorMode, Palette, palettes } from './palettes';

export type { ColorMode };

function contextValueForColorMode(colorMode: ColorMode): ColorModeContextValue {
  return {
    colorMode,
    ...palettes[colorMode],
  };
}

export const ColorModeContext = createContext<ColorModeContextValue>(contextValueForColorMode('light'));

interface ColorModeContextValue extends Palette {
  colorMode: ColorMode;
}

/**
 * @description Sets the color mode for nested elements so they can correctly
 * infer whether they are in a dark or light context. The `"dark"` and
 * `"light"` color modes are designed for neutral backgrounds, while the
 * `"darkTinted"` and `"lightTinted"` color modes are designed for tinted
 * backgrounds where foreground elements need to be desaturated.
 */
export function ColorModeProvider({ value: colorMode, children }: { value: ColorMode; children: ReactNode }) {
  return (
    <ColorModeContext.Provider value={useMemo(() => contextValueForColorMode(colorMode), [colorMode])}>
      {children}
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => {
  const context = useContext(ColorModeContext);
  const isDarkMode = useMemo(() => ['dark', 'darkTinted'].includes(context.colorMode), [context.colorMode]);
  return { ...context, isDarkMode };
};
