import { getColorValueForThemeWorklet, type ResponseByTheme } from '@/__swaps__/utils/swaps';
import { palettes } from '@/design-system/color/palettes';
import { isDrawMarket } from '@/features/polymarket/utils/sports';
import { type PolymarketPosition, type PolymarketTeamInfo } from '@/features/polymarket/types';
import { type PolymarketMarket, type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeTeamColor } from '@/features/polymarket/utils/getOutcomeTeam';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { isTeamBasedOutcome } from '@/features/polymarket/utils/marketClassification';
import { getColorBySeed } from '@/features/polymarket/utils/getColorBySeed';

type MarketColors = {
  color: ResponseByTheme<string>;
  secondaryColor: ResponseByTheme<string> | undefined;
};

export function getMarketColors(market: RawPolymarketMarket, eventColor: ResponseByTheme<string>): MarketColors {
  if (market.seriesColor) {
    const [primary, secondary] = market.seriesColor.split(',');
    return {
      color: getHighContrastColorTheme(primary),
      secondaryColor: secondary ? getHighContrastColorTheme(secondary) : undefined,
    };
  }

  if (isSingleMarketEvent(market)) {
    return {
      color: eventColor,
      secondaryColor: undefined,
    };
  }

  return {
    color: getColorBySeed(market.conditionId),
    secondaryColor: undefined,
  };
}

function isSingleMarketEvent(market: RawPolymarketMarket) {
  return market.negRisk === false && market.groupItemTitle === '';
}

export function getPositionAccentColor(position: PolymarketPosition): ResponseByTheme<string> {
  if (isTeamBasedOutcome(position.outcome) && position.teams) {
    return getOutcomeTeamColor({ outcome: position.outcome, outcomeIndex: position.outcomeIndex, teams: position.teams });
  }
  return position.market.color;
}

const drawColor = { light: '#808080', dark: '#808080' };

export function getOutcomeColor({
  market,
  outcome,
  outcomeIndex,
  isDarkMode,
  teams,
}: {
  market: PolymarketMarket;
  outcome: string;
  outcomeIndex: number;
  isDarkMode: boolean;
  teams?: PolymarketTeamInfo[];
}): string {
  const green = palettes[isDarkMode ? 'dark' : 'light'].foregroundColors.green;
  const red = palettes[isDarkMode ? 'dark' : 'light'].foregroundColors.red;
  if (!teams) return outcomeIndex === 0 ? green : red;

  const teamColorTheme = getOutcomeTeamColor({ outcome, outcomeIndex, teams });
  const isDraw = isDrawMarket(market);
  const teamAccentColor = getColorValueForThemeWorklet(teamColorTheme, isDarkMode);
  const drawAccentColor = getColorValueForThemeWorklet(drawColor, isDarkMode);
  return isDraw ? drawAccentColor : teamAccentColor;
}

function getHighContrastColorTheme(color: string): ResponseByTheme<string> {
  return {
    light: getHighContrastColor(color, false),
    dark: getHighContrastColor(color, true),
  };
}
