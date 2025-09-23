import React, { createContext, useContext, useMemo } from 'react';
import { useColorMode } from '@/design-system';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { HYPERLIQUID_GREEN, HYPERLIQUID_GREEN_LIGHT } from '@/features/perps/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

const theme = {
  dark: {
    primary: HYPERLIQUID_GREEN,
  },
  light: {
    primary: HYPERLIQUID_GREEN_LIGHT,
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
  gradient: string[];
  priceChangeColors: {
    positive: string;
    negative: string;
    neutral: string;
  };
  slider: {
    activeLeft: string;
    inactiveLeft: string;
    activeRight: string;
    inactiveRight: string;
  };
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
      surfacePrimary: isDarkMode ? '#171E20' : 'white',
      gradient: isDarkMode ? ['#72FFD9', '#3ECFAD'] : ['#31C8A4'],
      priceChangeColors: {
        positive: getColorForTheme('green', isDarkMode ? 'dark' : 'light'),
        negative: getColorForTheme('red', isDarkMode ? 'dark' : 'light'),
        neutral: getColorForTheme('labelTertiary', isDarkMode ? 'dark' : 'light'),
      },
      slider: {
        activeLeft: primary,
        inactiveLeft: primary,
        activeRight: isDarkMode ? opacityWorklet('#F5F8FF', 0.06) : opacityWorklet(primary, 0.12),
        inactiveRight: isDarkMode ? opacityWorklet('#F5F8FF', 0.06) : opacityWorklet(primary, 0.12),
      },
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
