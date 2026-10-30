import { useMemo } from 'react';

import { globalColors, useColorMode } from '@/design-system';
import { getHighContrastColor } from '@/design-system/color/getHighContrastColor';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';

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
