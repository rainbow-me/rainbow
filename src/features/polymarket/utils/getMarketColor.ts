import { getHighContrastColor, ResponseByTheme } from '@/__swaps__/utils/swaps';
import { PolymarketPosition } from '@/features/polymarket/types';
import { RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeTeam } from '@/features/polymarket/utils/getOutcomeTeam';
import colors from '@/styles/colors';
import { addressHashedColorIndex } from '@/utils/profileUtils';

type MarketColors = {
  color: ResponseByTheme<string>;
  secondaryColor: ResponseByTheme<string> | undefined;
};

export function getMarketColors(market: RawPolymarketMarket, eventColor: ResponseByTheme<string>): MarketColors {
  if (market.seriesColor) {
    const [primary, secondary] = market.seriesColor.split(',');
    return {
      color: getHighContrastColor(primary),
      secondaryColor: secondary ? getHighContrastColor(secondary) : undefined,
    };
  }

  if (isSingleMarketEvent(market)) {
    return {
      color: eventColor,
      secondaryColor: undefined,
    };
  }

  const colorIndex = addressHashedColorIndex(market.id) ?? 0;
  const baseColor = colors.avatarBackgrounds[colorIndex];
  return {
    color: getHighContrastColor(baseColor),
    secondaryColor: undefined,
  };
}

function isSingleMarketEvent(market: RawPolymarketMarket) {
  return market.negRisk === false && market.groupItemTitle === '';
}

export function getPositionAccentColor(position: PolymarketPosition): ResponseByTheme<string> {
  if (position.teams) {
    const team = getOutcomeTeam(position.outcome, position.teams);
    if (team?.color) return getHighContrastColor(team.color);
  }
  return position.market.color;
}
