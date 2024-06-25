import chroma from 'chroma-js';
import { useMemo } from 'react';
import { globalColors, useColorMode } from '@/design-system';
import { useTheme } from '@/theme';
import { useAccountProfile } from '@/hooks';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';

const getHighContrastAccentColor = (accentColor: string, isDarkMode: boolean) => {
  const contrast = chroma.contrast(accentColor, isDarkMode ? '#191A1C' : globalColors.white100);
  if (contrast < 2.125) {
    if (isDarkMode) {
      const brightenedColor = chroma(accentColor).brighten(1).saturate(0.5).css();
      return brightenedColor;
    } else {
      const darkenedColor = chroma(accentColor).darken(1).saturate(0.5).css();
      return darkenedColor;
    }
  } else {
    return accentColor;
  }
};

export function useAccountAccentColor() {
  const { accountColor, accountImage, accountSymbol } = useAccountProfile();
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();

  const dominantColor = usePersistentDominantColorFromImage(accountImage);
  const fallbackColor = isDarkMode ? globalColors.blue50 : globalColors.blue60;

  const accentColor = useMemo(() => {
    if (accountImage) {
      return dominantColor || fallbackColor;
    } else if (typeof accountColor === 'number') {
      return colors.avatarBackgrounds[accountColor];
    } else {
      return fallbackColor;
    }
  }, [accountImage, dominantColor, fallbackColor, accountColor, colors.avatarBackgrounds]);

  const highContrastAccentColor = useMemo(() => {
    return getHighContrastAccentColor(accentColor, isDarkMode);
  }, [accentColor, isDarkMode]);

  const hasLoaded = accountImage || accountSymbol;

  return {
    accentColor,
    highContrastAccentColor,
    loaded: hasLoaded,
  };
}
