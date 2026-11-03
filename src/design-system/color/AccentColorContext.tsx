import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

import chroma from 'chroma-js';

import { ColorModeContext } from './ColorMode';
import { type BackgroundColorValue } from './palettes';

export const AccentColorContext = createContext<BackgroundColorValue | null>(null);

export interface AccentColorProviderProps {
  color: string;
  children: ReactNode;
}

export function useAccentColor(): BackgroundColorValue {
  const context = useContext(AccentColorContext);
  if (!context) {
    throw new Error('useAccentColor must be used within an AccentColorProvider');
  }
  return context;
}

/**
 * @description Sets the `"accent"` color for an entire subtree of the app.
 */
export function AccentColorProvider({ color, children }: AccentColorProviderProps) {
  const { backgroundColors } = useContext(ColorModeContext);
  const contextValue = useMemo<BackgroundColorValue>(() => {
    const isValid = chroma.valid(color);
    return {
      color: isValid ? color : backgroundColors.blue.color,
      mode: isValid && chroma.contrast(color, '#fff') > 2.125 ? 'darkTinted' : 'lightTinted',
    };
  }, [backgroundColors.blue.color, color]);

  return <AccentColorContext.Provider value={contextValue}>{children}</AccentColorContext.Provider>;
}
