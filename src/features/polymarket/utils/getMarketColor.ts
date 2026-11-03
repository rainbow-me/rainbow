import { getHighContrastColor } from '@/design-system/color/getHighContrastColor';
import { foregroundColors } from '@/design-system/color/palettes';
import { type PolymarketPosition, type PolymarketTeamInfo } from '@/features/polymarket/types';
import { type PolymarketMarket, type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getColorBySeed } from '@/features/polymarket/utils/getColorBySeed';
import { getOutcomeTeamColor } from '@/features/polymarket/utils/getOutcomeTeam';
import { isTeamBasedOutcome } from '@/features/polymarket/utils/marketClassification';
import { isDrawMarket } from '@/features/polymarket/utils/sports';
import { type ResponseByTheme } from '@/theme/types';

const DRAW_COLOR = Object.freeze({ light: '#808080', dark: '#808080' });

/**
 * Returns light and dark variants of a market's primary and optional secondary accent colors.
 */
export function getMarketColors(
  market: RawPolymarketMarket,
  eventColor: ResponseByTheme<string>
): { color: ResponseByTheme<string>; secondaryColor: ResponseByTheme<string> | undefined } {
  if (market.seriesColor) {
    const [primary, secondary] = market.seriesColor.split(',');
    return {
      color: primary ? getHighContrastColor(primary) : eventColor,
      secondaryColor: secondary ? getHighContrastColor(secondary) : undefined,
    };
  }

  if (isSingleMarketEvent(market)) return { color: eventColor, secondaryColor: undefined };

  return {
    color: getColorBySeed(market.conditionId),
    secondaryColor: undefined,
  };
}

/**
 * Returns light and dark accent colors for a single Polymarket outcome.
 */
export function getOutcomeColors({
  market,
  outcome,
  outcomeIndex,
  teams,
}: {
  market: PolymarketMarket;
  outcome: string;
  outcomeIndex: number;
  teams: PolymarketTeamInfo[] | undefined;
}): ResponseByTheme<string> {
  if (!teams) return outcomeIndex === 0 ? foregroundColors.green : foregroundColors.red;

  return isDrawMarket(market) ? DRAW_COLOR : getOutcomeTeamColor({ outcome, outcomeIndex, teams });
}

/**
 * Returns light and dark accent colors for a Polymarket position.
 */
export function getPositionColors(position: PolymarketPosition): ResponseByTheme<string> {
  if (isTeamBasedOutcome(position.outcome) && position.teams) {
    return getOutcomeTeamColor({ outcome: position.outcome, outcomeIndex: position.outcomeIndex, teams: position.teams });
  }
  return position.market.color;
}

function isSingleMarketEvent(market: RawPolymarketMarket) {
  return market.negRisk === false && market.groupItemTitle === '';
}
