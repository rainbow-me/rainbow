import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import colors from '@/styles/colors';
import { addressHashedColorIndex } from '@/utils/profileUtils';

type MarketColors = {
  color: string;
  secondaryColor: string | undefined;
};

export function getMarketColors(market: { id: string; seriesColor?: string }): MarketColors {
  // TODO: Imperatively getting this would mean this does not adjust when toggling modes, but a hook would be inconvenient
  const isDarkMode = true;

  if (market.seriesColor) {
    // seriesColor can be either a single color or a primary/secondary color pair
    const [primary, secondary] = market.seriesColor.split(',');
    return {
      color: getHighContrastColor(primary, isDarkMode),
      secondaryColor: secondary ? getHighContrastColor(secondary, isDarkMode) : undefined,
    };
  }

  const colorIndex = addressHashedColorIndex(market.id) ?? 0;
  return {
    color: colors.avatarBackgrounds[colorIndex],
    secondaryColor: undefined,
  };
}
