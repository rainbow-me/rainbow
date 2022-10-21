import { maybeSignUri } from '@/handlers/imgix';
import { useTheme } from '@/theme';
import {
  useAccountProfile,
  usePersistentDominantColorFromImage,
} from '@/hooks';

export function useAccountAccentColor() {
  const { accountColor, accountImage } = useAccountProfile();

  const { result: dominantColor, state } = usePersistentDominantColorFromImage(
    maybeSignUri(accountImage ?? '') ?? ''
  );

  const { colors } = useTheme();
  let accentColor = colors.white;
  if (accountImage) {
    accentColor = dominantColor || colors.white;
  } else if (typeof accountColor === 'number') {
    accentColor = colors.avatarBackgrounds[accountColor];
  }
  return {
    accentColor,
    loaded: state === 2 || state === 3,
  };
}
