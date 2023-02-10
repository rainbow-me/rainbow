import { maybeSignUri } from '@/handlers/imgix';
import { useTheme } from '@/theme';
import {
  useAccountProfile,
  usePersistentDominantColorFromImage,
} from '@/hooks';

export function useAccountAccentColor() {
  const { accountColor, accountImage, accountSymbol } = useAccountProfile();

  const { result: dominantColor, state } = usePersistentDominantColorFromImage(
    maybeSignUri(accountImage ?? '', { w: 200 }) ?? ''
  );

  const { colors } = useTheme();
  let accentColor = colors.appleBlue;
  if (accountImage) {
    accentColor = dominantColor || colors.appleBlue;
  } else if (typeof accountColor === 'number') {
    accentColor = colors.avatarBackgrounds[accountColor];
  }

  const hasImageColorLoaded = state === 2 || state === 3;
  const hasLoaded = accountImage || accountSymbol || hasImageColorLoaded;

  return {
    accentColor,
    loaded: hasLoaded,
  };
}
