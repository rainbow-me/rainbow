import { useMemo } from 'react';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { useBackgroundColor, useColorMode, useForegroundColor } from '@/design-system';
import { usePolymarketSportsEventDisplay } from '@/features/polymarket/hooks/usePolymarketSportsEventDisplay';
import { getLeagueId, SPORT_LEAGUES, type LeagueId } from '@/features/polymarket/leagues';
import { type PolymarketEvent, type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { parsePeriod, parseScore, type PolymarketEventGameInfo } from '@/features/polymarket/utils/sports';
import { formatOdds, type BetCellData, type EventBetGrid } from '@/features/polymarket/utils/sportsEventBetData';
import { getSportsEventOutcomeCellColor } from '@/features/polymarket/utils/sportsEventOutcome';
import * as i18n from '@/languages';
import { createOpacityPalette } from '@/worklets/colors';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';

export type SportsEventTeamRow = {
  isFallback?: boolean;
  label?: string;
  line?: BetCellData;
  moneyline?: BetCellData;
};

export type SportsEventRows = {
  away: SportsEventTeamRow;
  home: SportsEventTeamRow;
};

export function useSportsEventContent(event: PolymarketEvent) {
  const cardBackground = useBackgroundColor('fillQuaternary');
  const fillTertiary = useBackgroundColor('fillTertiary');
  const borderColor = useForegroundColor('separatorSecondary');
  const { isDarkMode } = useColorMode();

  const { betGrid, gameInfo, isLive, scores, showScores, teamLabels, title } = usePolymarketSportsEventDisplay(event);
  const periodTitle = useMemo(
    () =>
      isLive
        ? getPeriodTitle({
            period: gameInfo.period ?? '',
            elapsed: gameInfo.elapsed,
            score: gameInfo.score ?? '',
          })
        : undefined,
    [isLive, gameInfo.period, gameInfo.elapsed, gameInfo.score]
  );
  const subtitle = useMemo(() => (isLive ? undefined : getSubtitle({ event, gameInfo })), [event, gameInfo, isLive]);

  const awayBets = betGrid.teamBets.away;
  const homeBets = betGrid.teamBets.home;
  const totals = betGrid.totals;
  const awaySpreadColor = getSportsEventOutcomeCellColor(event.markets, awayBets.spread?.outcomeTokenId, isDarkMode, event.teams);
  const homeSpreadColor = getSportsEventOutcomeCellColor(event.markets, homeBets.spread?.outcomeTokenId, isDarkMode, event.teams);
  const totalsOverColor = getSportsEventOutcomeCellColor(event.markets, totals.over?.outcomeTokenId, isDarkMode, event.teams);
  const totalsUnderColor = getSportsEventOutcomeCellColor(event.markets, totals.under?.outcomeTokenId, isDarkMode, event.teams);
  const awayMoneylineColor = getSportsEventOutcomeCellColor(event.markets, awayBets.moneyline?.outcomeTokenId, isDarkMode, event.teams);
  const homeMoneylineColor = getSportsEventOutcomeCellColor(event.markets, homeBets.moneyline?.outcomeTokenId, isDarkMode, event.teams);
  const eventColor = getColorValueForThemeWorklet(event.color, isDarkMode);
  const accentColor =
    awayMoneylineColor ?? homeMoneylineColor ?? awaySpreadColor ?? homeSpreadColor ?? totalsOverColor ?? totalsUnderColor ?? eventColor;
  const accentPalette = createOpacityPalette(accentColor, [0, 8, 12, 18]);
  const cardGradientColors = isDarkMode
    ? ([accentPalette.opacity18, accentPalette.opacity8, accentPalette.opacity0] as const)
    : ([accentPalette.opacity12, accentPalette.opacity8, accentPalette.opacity0] as const);

  const rows = useMemo(() => getRows(event, betGrid), [betGrid, event]);
  const leagueId = useMemo(
    () => getLeagueId(event.slug) ?? getLeagueId(event.ticker ?? '') ?? getLeagueIdFromTags(event.tags),
    [event.slug, event.tags, event.ticker]
  );
  const eventAccentColor = useMemo(() => getEventAccentColor({ event, isDarkMode, leagueId }), [event, isDarkMode, leagueId]);
  const gameStatusTitle = useMemo(() => getGameStatusTitle({ event, gameInfo, isLive }), [event, gameInfo, isLive]);
  const teamLabelFontSize = useMemo(() => {
    return teamLabels[0].length > 14 || teamLabels[1].length > 14 ? ('10pt' as const) : ('13pt' as const);
  }, [teamLabels]);
  const betCellsPlaceholder = useMemo(() => {
    const awayRowCellCount = [awayBets.spread, totals.over, awayBets.moneyline].filter(Boolean).length;
    const homeRowCellCount = [homeBets.spread, totals.under, homeBets.moneyline].filter(Boolean).length;
    const maxCellCount = Math.max(awayRowCellCount, homeRowCellCount);
    const width = maxCellCount > 0 ? maxCellCount * 60 + (maxCellCount - 1) * 6 : 0;
    const height = 2 * 38 + 8;
    return { width, height };
  }, [awayBets.spread, awayBets.moneyline, homeBets.spread, homeBets.moneyline, totals.over, totals.under]);

  return {
    accentColor,
    awayBets,
    awayMoneylineColor,
    awaySpreadColor,
    betCellsPlaceholder,
    betGrid,
    borderColor,
    cardBackground,
    cardGradientColors,
    eventAccentColor,
    fillTertiary,
    gameInfo,
    gameStatusTitle,
    homeBets,
    homeMoneylineColor,
    homeSpreadColor,
    isDarkMode,
    isLive,
    leagueId,
    periodTitle,
    rows,
    scores,
    showScores,
    subtitle,
    teamLabelFontSize,
    teamLabels,
    title,
    totals,
    totalsOverColor,
    totalsUnderColor,
  };
}

function getLeagueIdFromTags(tags: PolymarketEvent['tags']): LeagueId | undefined {
  for (const tag of tags) {
    const leagueId = getLeagueId(tag.slug);
    if (leagueId) return leagueId;
  }
}

function getRows(event: PolymarketEvent, betGrid: EventBetGrid): SportsEventRows {
  const rows: SportsEventRows = {
    away: {
      line: betGrid.totals.over ?? betGrid.teamBets.away.spread,
      moneyline: betGrid.teamBets.away.moneyline,
    },
    home: {
      line: betGrid.totals.under ?? betGrid.teamBets.home.spread,
      moneyline: betGrid.teamBets.home.moneyline,
    },
  };

  if (hasBetCells(rows)) return rows;

  return getFallbackMarketRows(event) ?? rows;
}

function hasBetCells(rows: SportsEventRows) {
  return !!(rows.away.line || rows.away.moneyline || rows.home.line || rows.home.moneyline);
}

function getFallbackMarketRows(event: PolymarketEvent): SportsEventRows | null {
  const markets = event.markets
    .filter(isRenderableFallbackMarket)
    .sort((a, b) => Number(b.outcomePrices[0] ?? 0) - Number(a.outcomePrices[0] ?? 0))
    .slice(0, 2);

  if (markets.length < 2) return null;

  return {
    away: getFallbackMarketRow(markets[0]),
    home: getFallbackMarketRow(markets[1]),
  };
}

function isRenderableFallbackMarket(market: PolymarketMarket) {
  return (
    market.active !== false &&
    market.closed !== true &&
    market.umaResolutionStatus !== 'resolved' &&
    !!market.groupItemTitle &&
    market.outcomePrices[0] != null &&
    market.outcomePrices[0] !== '' &&
    !!market.clobTokenIds[0]
  );
}

function getFallbackMarketRow(market: PolymarketMarket): SportsEventTeamRow {
  return {
    isFallback: true,
    label: market.groupItemTitle,
    moneyline: {
      label: '',
      odds: formatOdds(market.outcomePrices[0]),
      outcomeTokenId: market.clobTokenIds[0],
    },
  };
}

function getGameStatusTitle({ event, gameInfo, isLive }: { event: PolymarketEvent; gameInfo: PolymarketEventGameInfo; isLive: boolean }) {
  if (isLive) {
    const { currentPeriod } = parsePeriod(gameInfo.period ?? '');
    const parsedScore = parseScore(gameInfo.score ?? '');
    if ('bestOf' in parsedScore && parsedScore.bestOf !== undefined && currentPeriod) {
      return i18n.t(i18n.l.predictions.sports.game_best_of, { currentPeriod, bestOf: String(parsedScore.bestOf) });
    }
    return currentPeriod || gameInfo.elapsed || undefined;
  }

  if (gameInfo.ended) return i18n.t(i18n.l.predictions.sports.final);

  const startTime = gameInfo.startTime ?? event.startDate;
  return startTime ? formatTimestamp(toUnixTime(startTime)) : undefined;
}

function getSubtitle({ event, gameInfo }: { event: PolymarketEvent; gameInfo: PolymarketEventGameInfo }) {
  if (gameInfo.ended) {
    return i18n.t(i18n.l.predictions.sports.final).toUpperCase();
  }

  const startTime = gameInfo.startTime ?? event.startDate;
  return startTime ? formatTimestamp(toUnixTime(startTime)) : '';
}

function getPeriodTitle({ score, period, elapsed }: { score: string; period: string; elapsed?: string }) {
  const { currentPeriod } = parsePeriod(period);
  const parsedScore = parseScore(score);
  if ('bestOf' in parsedScore && parsedScore.bestOf !== undefined && currentPeriod) {
    return i18n.t(i18n.l.predictions.sports.game_best_of, { currentPeriod, bestOf: String(parsedScore.bestOf) });
  }
  if (currentPeriod && elapsed) return `${currentPeriod} - ${elapsed}`;
  if (currentPeriod) return currentPeriod;
  return elapsed ?? '';
}

function getEventAccentColor({ event, isDarkMode, leagueId }: { event: PolymarketEvent; isDarkMode: boolean; leagueId?: LeagueId }) {
  const leagueColor = leagueId ? SPORT_LEAGUES[leagueId]?.color : undefined;
  if (leagueColor) return getColorValueForThemeWorklet(leagueColor, isDarkMode);
  return getColorValueForThemeWorklet(event.color, isDarkMode);
}
