import { useTheme } from '@/theme';
import { useAccountProfile } from '@/hooks';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';

export function useAccountAccentColor() {
  const { accountColor, accountImage, accountSymbol } = useAccountProfile();

  const dominantColor = usePersistentDominantColorFromImage(accountImage);

  const { colors } = useTheme();
  let accentColor = colors.appleBlue;
  if (accountImage) {
    accentColor = dominantColor || colors.appleBlue;
  } else if (typeof accountColor === 'number') {
    accentColor = colors.avatarBackgrounds[accountColor];
  }

  const hasLoaded = accountImage || accountSymbol;

  return {
    accentColor,
    loaded: hasLoaded,
  };
}
