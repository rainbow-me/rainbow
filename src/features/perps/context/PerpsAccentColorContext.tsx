import React, { createContext, useContext, useMemo } from 'react';
import { useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { type LinearGradientProps } from 'expo-linear-gradient';

export const HYPERLIQUID_GREEN = '#3ECFAD';
export const HYPERLIQUID_GREEN_LIGHT = '#31C8A4';
const SHORT_RED = '#C4362D';
const LONG_GREEN = '#23D246';

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
  opacity80: string;
  opacity56: string;
  opacity40: string;
  opacity24: string;
  opacity12: string;
  opacity10: string;
  opacity8: string;
  opacity7: string;
  opacity6: string;
  opacity5: string;
  opacity4: string;
  opacity3: string;
  opacity2: string;
  opacity1: string;
  surfacePrimary: string;
  gradient: LinearGradientProps['colors'];
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
  shortRed: string;
  longGreen: string;
};

type PerpsAccentColorContextType = {
  accentColors: PerpsAccentColors;
};

type PerpsAccentColorContextProviderProps = {
  children: React.ReactNode;
  primaryColorOverride?: string;
};

const PerpsAccentColorContext = createContext<PerpsAccentColorContextType | undefined>(undefined);

export function usePerpsAccentColorContext() {
  const context = useContext(PerpsAccentColorContext);
  if (context === undefined) {
    throw new Error('usePerpsAccentColorContext must be used within an PerpsAccentColorContextProvider');
  }
  return context;
}

export function PerpsAccentColorContextProvider({ children, primaryColorOverride }: PerpsAccentColorContextProviderProps) {
  const { isDarkMode } = useColorMode();

  const accentColors: PerpsAccentColors = useMemo(() => {
    const primary = primaryColorOverride ?? theme[isDarkMode ? 'dark' : 'light'].primary;
    const gradient: LinearGradientProps['colors'] = primaryColorOverride
      ? isDarkMode
        ? [primary, opacity(primary, 0.8)]
        : [primary, primary]
      : isDarkMode
        ? ['#72FFD9', '#3ECFAD']
        : ['#31C8A4', '#31C8A4'];

    return {
      opacity100: primary,
      opacity80: opacity(primary, 0.8),
      opacity56: opacity(primary, 0.56),
      opacity40: opacity(primary, 0.4),
      opacity24: opacity(primary, 0.24),
      opacity12: opacity(primary, 0.12),
      opacity10: opacity(primary, 0.1),
      opacity8: opacity(primary, 0.08),
      opacity7: opacity(primary, 0.07),
      opacity6: opacity(primary, 0.06),
      opacity5: opacity(primary, 0.05),
      opacity4: opacity(primary, 0.04),
      opacity3: opacity(primary, 0.03),
      opacity2: opacity(primary, 0.02),
      opacity1: opacity(primary, 0.01),
      surfacePrimary: isDarkMode ? '#171E20' : 'white',
      gradient,
      priceChangeColors: {
        positive: getColorForTheme('green', isDarkMode ? 'dark' : 'light'),
        negative: getColorForTheme('red', isDarkMode ? 'dark' : 'light'),
        neutral: getColorForTheme('labelTertiary', isDarkMode ? 'dark' : 'light'),
      },
      slider: {
        activeLeft: primary,
        inactiveLeft: primary,
        activeRight: isDarkMode ? opacity('#F5F8FF', 0.06) : opacity(primary, 0.12),
        inactiveRight: isDarkMode ? opacity('#F5F8FF', 0.06) : opacity(primary, 0.12),
      },
      shortRed: SHORT_RED,
      longGreen: LONG_GREEN,
    } satisfies PerpsAccentColors;
  }, [isDarkMode, primaryColorOverride]);

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
