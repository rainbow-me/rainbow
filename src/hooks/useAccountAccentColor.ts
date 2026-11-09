import { createDerivedStore, createQueryStore } from '@storesjs/stores';

import { globalColors } from '@/design-system';
import { getHighContrastColor } from '@/design-system/color/getHighContrastColor';
import { time } from '@/framework/core/utils/time';
import { calculateAndCacheDominantColor } from '@/hooks/usePersistentDominantColorFromImage';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useThemeStore } from '@/theme/themeStore';
import { shallowEqual } from '@/worklets/comparisons';

// ============ Helper Stores ================================================== //

const useDominantColorStore = createQueryStore({
  fetcher: getDominantColor,
  params: {
    accountImage: $ => $(useAccountProfileInfo, state => state.accountImage),
  },
  disableAutoRefetching: true,
  staleTime: time.weeks(1),
});

// ============ useAccountAccentColor ========================================== //

export const useAccountAccentColor = createDerivedStore(
  $ => {
    const { accountAddress, accountColor, accountColorHex, accountImage, accountSymbol } = $(useAccountProfileInfo, state => state);
    const dominantColor = $(useDominantColorStore, state => state.getData());
    const isDarkMode = $(useThemeStore).isDarkMode;

    const hasLoaded = Boolean(accountAddress && (accountSymbol || accountImage));
    const fallback = isDarkMode ? globalColors.blue50 : globalColors.blue60;

    const accentColor = accountImage
      ? dominantColor || fallback
      : typeof accountColor === 'number' && accountColorHex
        ? accountColorHex
        : fallback;

    return {
      accentColor: hasLoaded ? accentColor : fallback,
      highContrastAccentColor: hasLoaded ? (getHighContrastColor(accentColor, isDarkMode) ?? fallback) : fallback,
      loaded: hasLoaded,
    };
  },
  { equalityFn: shallowEqual }
);

// ============ Helper Functions =============================================== //

async function getDominantColor({ accountImage }: { accountImage: string | null | undefined }) {
  return calculateAndCacheDominantColor(accountImage);
}
