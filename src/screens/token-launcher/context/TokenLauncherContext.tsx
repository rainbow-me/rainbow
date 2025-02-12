import React, { createContext, useContext, useMemo } from 'react';
import { getAlphaColor, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { useColorMode } from '@/design-system';
import { useTheme } from '@/theme';
import { DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR } from '../constants';

type TokenLauncherContextType = {
  accentColors: {
    opacity100: string;
    opacity30: string;
    opacity12: string;
    opacity10: string;
    opacity6: string;
    opacity4: string;
    opacity3: string;
    opacity2: string;
  };
};

const TokenLauncherContext = createContext<TokenLauncherContextType | undefined>(undefined);

export function useTokenLauncherContext() {
  const context = useContext(TokenLauncherContext);
  if (context === undefined) {
    throw new Error('useTokenLauncherContext must be used within a TokenLauncherContextProvider');
  }
  return context;
}

export function TokenLauncherContextProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();

  const imageUrl = useTokenLauncherStore(state => state.imageUrl);
  const imageDerivedColor = usePersistentDominantColorFromImage(imageUrl);

  const accentColors = useMemo(() => {
    let primaryColor = imageDerivedColor ?? DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR;
    try {
      // brighten up dark colors in dark mode
      if (isDarkMode && colors.isColorDark(primaryColor)) {
        primaryColor = colors.brighten(primaryColor);
      } else if (!isDarkMode) {
        primaryColor = getHighContrastColor(primaryColor, isDarkMode);
      }
    } catch (e) {
      // do nothing
    }

    // console.log('primaryColor', primaryColor, imageDerivedColor);

    return {
      opacity100: primaryColor,
      opacity30: getAlphaColor(primaryColor, 0.3),
      opacity12: getAlphaColor(primaryColor, 0.12),
      opacity10: getAlphaColor(primaryColor, 0.1),
      opacity6: getAlphaColor(primaryColor, 0.06),
      opacity4: getAlphaColor(primaryColor, 0.04),
      opacity3: getAlphaColor(primaryColor, 0.03),
      opacity2: getAlphaColor(primaryColor, 0.02),
    };
  }, [colors, imageDerivedColor, isDarkMode]);

  return <TokenLauncherContext.Provider value={{ accentColors }}>{children}</TokenLauncherContext.Provider>;
}
