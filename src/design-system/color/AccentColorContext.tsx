import chroma from 'chroma-js';
import React, { createContext, ReactNode, useMemo } from 'react';
import { BackgroundColorValue, defaultAccentColor } from './palettes';

export const AccentColorContext = createContext<BackgroundColorValue>(
  defaultAccentColor
);

export interface AccentColorProviderProps {
  color: string;
  children: ReactNode;
}

/**
 * @description Sets the `"accent"` color for an entire subtree of the app.
 */
export function AccentColorProvider({
  color,
  children,
}: AccentColorProviderProps) {
  const contextValue = useMemo(
    () =>
      ({
        color,
        mode:
          chroma.contrast(color, '#fff') > 2.125 ? 'darkTinted' : 'lightTinted',
      } as const),
    [color]
  );

  return (
    <AccentColorContext.Provider value={contextValue}>
      {children}
    </AccentColorContext.Provider>
  );
}
