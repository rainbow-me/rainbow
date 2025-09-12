import React, { createContext, useContext, useMemo } from 'react';
import { useColorMode } from '@/design-system';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { HYPERLIQUID_GREEN, PERPS_COLORS } from '@/features/perps/constants';

const theme = {
  dark: {
    primary: HYPERLIQUID_GREEN,
  },
  light: {
    primary: HYPERLIQUID_GREEN,
  },
};

type PerpsAccentColors = {
  opacity100: string;
  opacity56: string;
  opacity40: string;
  opacity24: string;
  opacity12: string;
  opacity10: string;
  opacity8: string;
  opacity6: string;
  opacity4: string;
  opacity3: string;
  opacity2: string;
  opacity1: string;
  surfacePrimary: string;
};

type PerpsAccentColorContextType = {
  accentColors: PerpsAccentColors;
};

type PerpsAccentColorContextProviderProps = {
  children: React.ReactNode;
};

const PerpsAccentColorContext = createContext<PerpsAccentColorContextType | undefined>(undefined);

export function usePerpsAccentColorContext() {
  const context = useContext(PerpsAccentColorContext);
  if (context === undefined) {
    throw new Error('usePerpsAccentColorContext must be used within an PerpsAccentColorContextProvider');
  }
  return context;
}

export function PerpsAccentColorContextProvider({ children }: PerpsAccentColorContextProviderProps) {
  const { isDarkMode } = useColorMode();

  const accentColors: PerpsAccentColors = useMemo(() => {
    const primary = theme[isDarkMode ? 'dark' : 'light'].primary;
    return {
      opacity100: primary,
      opacity80: opacityWorklet(primary, 0.8),
      opacity56: opacityWorklet(primary, 0.56),
      opacity40: opacityWorklet(primary, 0.4),
      opacity24: opacityWorklet(primary, 0.24),
      opacity12: opacityWorklet(primary, 0.12),
      opacity10: opacityWorklet(primary, 0.1),
      opacity8: opacityWorklet(primary, 0.08),
      opacity6: opacityWorklet(primary, 0.06),
      opacity4: opacityWorklet(primary, 0.04),
      opacity3: opacityWorklet(primary, 0.03),
      opacity2: opacityWorklet(primary, 0.02),
      opacity1: opacityWorklet(primary, 0.01),
      surfacePrimary: '#171E20',
    };
  }, [isDarkMode]);

  return (
    <PerpsAccentColorContext.Provider
      value={{
        accentColors,
      }}
    >
      {children}
    </PerpsAccentColorContext.Provider>
  );
}
