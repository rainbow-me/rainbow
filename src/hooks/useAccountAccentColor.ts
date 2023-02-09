import { useTheme } from '@/theme';
import { useAccountProfile } from '@/hooks';

type ReturnType = {
  accentColor: string;
  loaded: boolean;
};

export function useAccountAccentColor(): ReturnType {
  const { accountColor, accountImage, accountSymbol } = useAccountProfile();

  const { colors } = useTheme();
  const hasLoaded = Boolean(accountImage || accountSymbol);

  return {
    accentColor:
      accountImage || accountColor === undefined
        ? colors.appleBlue
        : colors.avatarBackgrounds[accountColor],
    loaded: hasLoaded,
  };
}
