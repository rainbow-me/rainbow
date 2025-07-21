import React, { createContext, useContext, useMemo } from 'react';
import { AssetAccentColors } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';
import chroma from 'chroma-js';
import { ThemeContextProps, useTheme } from '@/theme';
import { extractColorValueForColors } from '@/__swaps__/utils/swaps';

const DEFAULT_ACCENT_COLORS: AssetAccentColors = {
  opacity100: '#000000',
  opacity80: '#000000',
  opacity56: '#000000',
  opacity24: '#000000',
  opacity12: '#000000',
  opacity10: '#000000',
  opacity6: '#000000',
  opacity4: '#000000',
  opacity3: '#000000',
  opacity2: '#000000',
  opacity1: '#000000',
  color: '#000000',
  textOnAccent: '#000000',
  border: '#000000',
  borderSecondary: '#000000',
  surface: '#000000',
  surfaceSecondary: '#000000',
  background: '#000000',
};

type KingOfTheHillContextType = {
  accentColors: AssetAccentColors;
};

export function useKingOfTheHillContext() {
  const context = useContext(KingOfTheHillContext);
  if (context === undefined) {
    throw new Error('useKingOfTheHillContext must be used within an KingOfTheHillContextProvider');
  }
  return context;
}

export const KingOfTheHillContext = createContext<KingOfTheHillContextType | undefined>(undefined);

function getAccentColors(colors: ThemeContextProps['colors'], primaryColor: string, isDarkMode: boolean) {
  const background = chroma(
    chroma(primaryColor)
      .rgb()
      .map(channel => Math.round(channel * (1 - 0.8) + 0 * 0.8))
  ).css();

  const { textColor } = extractColorValueForColors({
    colors: {
      primary: primaryColor,
    },
  });

  return {
    opacity100: primaryColor,
    opacity80: colors.alpha(primaryColor, 0.8),
    opacity75: colors.alpha(primaryColor, 0.75),
    opacity56: colors.alpha(primaryColor, 0.56),
    opacity24: colors.alpha(primaryColor, 0.24),
    opacity12: colors.alpha(primaryColor, 0.12),
    opacity10: colors.alpha(primaryColor, 0.1),
    opacity6: colors.alpha(primaryColor, 0.06),
    opacity4: colors.alpha(primaryColor, 0.04),
    opacity3: colors.alpha(primaryColor, 0.03),
    opacity2: colors.alpha(primaryColor, 0.02),
    opacity1: colors.alpha(primaryColor, 0.01),
    color: primaryColor,
    textOnAccent: textColor[isDarkMode ? 'dark' : 'light'],
    border: colors.alpha(primaryColor, 0.03),
    borderSecondary: colors.alpha(primaryColor, 0.02),
    surface: colors.alpha(primaryColor, 0.06),
    surfaceSecondary: colors.alpha(primaryColor, 0.03),
    background: background,
  };
}

export function KingOfTheHillContextProvider({ children }: { children: React.ReactNode }) {
  const kingOfTheHill = useKingOfTheHillStore(state => state.getData());
  const { colors, isDarkMode } = useTheme();

  console.log(JSON.stringify(kingOfTheHill, null, 2));

  const accentColors = useMemo(() => {
    if (!kingOfTheHill?.current.token) return DEFAULT_ACCENT_COLORS;

    const accentColors = getAccentColors(colors, kingOfTheHill.current.token.colors.primary, isDarkMode);
    console.log(JSON.stringify(accentColors, null, 2));
    return accentColors;
  }, [colors, isDarkMode, kingOfTheHill]);

  return <KingOfTheHillContext.Provider value={{ accentColors }}>{children}</KingOfTheHillContext.Provider>;
}
