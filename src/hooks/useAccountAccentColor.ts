import { useTheme } from '@/theme';
import {
  useAccountProfile,
  usePersistentDominantColorFromImage,
} from '@/hooks';

type ReturnType = {
  accentColor: string;
  loaded: boolean;
};

export function useAccountAccentColor(): ReturnType {
  const { accountColor, accountImage, accountSymbol } = useAccountProfile();

  const {
    result: dominantColor,
    state,
  } = usePersistentDominantColorFromImage(accountImage, { signUrl: true });

  const { colors } = useTheme();
  let accentColor = colors.appleBlue;
  if (accountImage) {
    accentColor = dominantColor || colors.appleBlue;
  } else if (typeof accountColor === 'number') {
    accentColor = colors.avatarBackgrounds[accountColor];
  }
  const hasImageColorLoaded = state === 2 || state === 3;
  const hasLoaded = Boolean(
    accountImage || accountSymbol || hasImageColorLoaded
  );

  return {
    accentColor,
    loaded: hasLoaded,
  };
}
