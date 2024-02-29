import chroma from 'chroma-js';
import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { BackgroundColorValue } from './palettes';

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
  const contextValue = useMemo(
    () =>
      ({
        color,
        mode: chroma.contrast(color, '#fff') > 2.125 ? 'darkTinted' : 'lightTinted',
      }) as const,
    [color]
  );

  return <AccentColorContext.Provider value={contextValue}>{children}</AccentColorContext.Provider>;
}
