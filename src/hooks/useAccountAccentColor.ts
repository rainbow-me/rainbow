import { globalColors, useColorMode } from '@/design-system';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import chroma from 'chroma-js';
import { useMemo } from 'react';

const CONTRAST_THRESHOLD = 2.125;

export const getHighContrastColor = (color: string, isDarkMode: boolean) => {
  if (typeof color !== 'string' || !color) return color;
  const contrast = chroma.contrast(color, isDarkMode ? '#191A1C' : globalColors.white100);

  if (contrast < CONTRAST_THRESHOLD) {
    if (isDarkMode) {
      const brightenedColor = chroma(color).brighten(1).saturate(0.5).css();
      return brightenedColor;
    } else {
      const [l, c, h] = chroma(color).lch();
      return chroma.lch(l - Math.min(28, Math.max(0, (CONTRAST_THRESHOLD - contrast) * (c < 8 ? 32 : 24))), c, h).css();
    }
  } else return color;
};

export function useAccountAccentColor() {
  const { accountAddress, accountColor, accountImage, accountSymbol } = useAccountProfileInfo();
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

  const hasLoaded = Boolean(accountAddress && (accountSymbol || accountImage));

  return useMemo(() => {
    return {
      accentColor: hasLoaded ? accentColor : fallbackColor,
      highContrastAccentColor: hasLoaded ? getHighContrastColor(accentColor, isDarkMode) : fallbackColor,
      loaded: hasLoaded,
    };
  }, [accentColor, fallbackColor, hasLoaded, isDarkMode]);
}
