import { memo, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Text, useBackgroundColor, useColorMode, useForegroundColor } from '@/design-system';
import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { usePolymarketLiveGame } from '@/features/polymarket/hooks/usePolymarketLiveGame';
import {
  getMarketsGroupedByBetType,
  LineBasedGroup,
  MoneylineGroup,
} from '@/features/polymarket/screens/polymarket-event-screen/utils/getMarketsGroupedByBetType';
import { PolymarketEvent, PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { isDrawMarket, parsePeriod, parseScore, selectGameInfo, type PolymarketEventGameInfo } from '@/features/polymarket/utils/sports';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { roundWorklet, toPercentageWorklet } from '@/safe-math/SafeMath';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';
import { ImgixImage } from '@/components/images';

const BET_ROW_HEIGHT = 38;
const BET_ROW_WIDTH = 60;

export const HEIGHT = 176;

type BetCellData = {
  label: string;
  odds: string;
  outcomeTokenId?: string;
};

type BetRow = {
  spread?: BetCellData;
  moneyline?: BetCellData;
  total?: BetCellData;
};

type TeamDisplayInfo = {
  labels: [string, string];
  title: string;
};

export const PolymarketSportEventListItem = memo(function PolymarketSportEventListItem({
  event,
  style,
}: {
  event: PolymarketEvent;
  style?: StyleProp<ViewStyle>;
}) {
  const cardBackground = useBackgroundColor('fillSecondary');
  const borderColor = useForegroundColor('separatorSecondary');

  const liveGame = usePolymarketLiveGame(event.live && !event.ended ? event.gameId : undefined);
  const gameInfo = useMemo(() => selectGameInfo({ event, liveGame }), [event, liveGame]);
  const isLive = gameInfo.live && !gameInfo.ended;
  const { labels: teamLabels, title } = useMemo(() => getTeamDisplayInfo(event), [event]);
  const scores = useMemo(() => (isLive ? (gameInfo.score ? parseScore(gameInfo.score) : null) : null), [gameInfo.score, isLive]);
  const subtitle = useMemo(() => getSubtitle({ event, gameInfo, isLive }), [event, gameInfo, isLive]);
  const betRows = useMemo(() => buildBetRows(event, teamLabels), [event, teamLabels]);

  const teamLabelFontSize = useMemo(() => (teamLabels[0].length > 14 || teamLabels[1].length > 14 ? '10pt' : '13pt'), [teamLabels]);

  return (
    <ButtonPressAnimation onPress={() => navigateToEvent(event)} scaleTo={0.98} style={style}>
      <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.header}>
          <Text align="left" color="label" size="13pt" weight="heavy" numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text align="left" color="labelSecondary" size="10pt" weight="bold" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.body}>
          <View style={styles.teamColumn}>
            <View style={styles.teamRow}>
              <ImgixImage source={{ uri: event.teams?.[0]?.logo }} size={24} style={{ width: 24, height: 24, borderRadius: 4 }} />
              <Text align="left" color="label" size={teamLabelFontSize} weight="bold" numberOfLines={1}>
                {teamLabels[0]}
              </Text>
            </View>
            <View style={styles.teamRow}>
              <ImgixImage source={{ uri: event.teams?.[1]?.logo }} size={24} style={{ width: 24, height: 24, borderRadius: 4 }} />
              <Text align="left" color="label" size={teamLabelFontSize} weight="bold" numberOfLines={1}>
                {teamLabels[1]}
              </Text>
            </View>
          </View>
          <View style={styles.rightColumn}>
            {isLive ? (
              <View style={styles.scoreColumn}>
                <View style={styles.scoreRow}>
                  <Text align="right" color="label" size="13pt" weight="heavy" numberOfLines={1}>
                    {scores?.teamAScore ?? '--'}
                  </Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text align="right" color="label" size="13pt" weight="heavy" numberOfLines={1}>
                    {scores?.teamBScore ?? '--'}
                  </Text>
                </View>
              </View>
            ) : null}
            <View style={styles.betsColumn}>
              <View style={styles.betRow}>
                {betRows.top.spread && <BetCell data={betRows.top.spread} />}
                {betRows.top.moneyline && <BetCell data={betRows.top.moneyline} />}
                {betRows.top.total && <BetCell data={betRows.top.total} />}
              </View>
              <View style={styles.betRow}>
                {betRows.bottom.spread && <BetCell data={betRows.bottom.spread} />}
                {betRows.bottom.moneyline && <BetCell data={betRows.bottom.moneyline} />}
                {betRows.bottom.total && <BetCell data={betRows.bottom.total} />}
              </View>
            </View>
          </View>
        </View>
      </View>
    </ButtonPressAnimation>
  );
});

const BetCell = memo(function BetCell({ data, backgroundColor }: { data: BetCellData; backgroundColor?: string }) {
  const fillTertiary = useBackgroundColor('fillTertiary');
  const hasLabel = Boolean(data.label);
  const tokenId = data.outcomeTokenId ? getPolymarketTokenId(data.outcomeTokenId, 'sell') : undefined;
  return (
    <View style={[styles.betCell, { backgroundColor: backgroundColor ?? fillTertiary }]}>
      {hasLabel ? (
        <Text align="center" color="labelSecondary" size="12pt" weight="bold" numberOfLines={1}>
          {data.label}
        </Text>
      ) : null}
      {tokenId ? (
        <LiveTokenText
          align="center"
          color="label"
          size="12pt"
          weight="heavy"
          numberOfLines={1}
          tokenId={tokenId}
          initialValue={data.odds}
          selector={token => formatOdds(token.price)}
        />
      ) : (
        <Text align="center" color="label" size="12pt" weight="heavy" numberOfLines={1}>
          {data.odds}
        </Text>
      )}
    </View>
  );
});

export const LoadingSkeleton = memo(function LoadingSkeleton() {
  const { isDarkMode } = useColorMode();
  const fillSecondary = useBackgroundColor('fillSecondary');
  const fillQuaternary = useBackgroundColor('fillQuaternary');
  const shimmerColor = opacityWorklet(isDarkMode ? fillQuaternary : fillSecondary, isDarkMode ? 0.06 : 0.1);
  const skeletonColor = isDarkMode ? fillQuaternary : fillSecondary;

  return (
    <View style={[styles.skeleton, { backgroundColor: skeletonColor }]}>
      <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
    </View>
  );
});

function navigateToEvent(event: PolymarketEvent): void {
  Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { event, eventId: event.id });
}

function getSubtitle({ event, gameInfo, isLive }: { event: PolymarketEvent; gameInfo: PolymarketEventGameInfo; isLive: boolean }) {
  if (isLive) {
    const periodTitle = getPeriodTitle({
      period: gameInfo.period ?? '',
      elapsed: gameInfo.elapsed,
      score: gameInfo.score ?? '',
    });
    return `${i18n.t(i18n.l.predictions.sports.live)} • ${periodTitle}`;
  }

  const startTime = gameInfo.startTime ?? event.startDate;
  return startTime ? formatTimestamp(toUnixTime(startTime)) : '';
}

function getTeamDisplayInfo(event: PolymarketEvent): TeamDisplayInfo {
  let title = event.title;
  if (event.teams?.length && event.teams.length >= 2) {
    const teamA = event.teams[0];
    const teamB = event.teams[1];
    let labels: [string, string] = [teamA.name, teamB.name];
    if (teamA.name.length > 14 || (teamB.name.length > 14 && teamA.abbreviation && teamB.abbreviation)) {
      labels = [teamA.abbreviation?.toUpperCase(), teamB.abbreviation?.toUpperCase()];
    }
    title = `${teamA.name} vs. ${teamB.name}`;
    return { labels, title };
  }
  if (event.awayTeamName && event.homeTeamName) {
    const labels: [string, string] = [event.awayTeamName, event.homeTeamName];
    title = `${event.awayTeamName} vs. ${event.homeTeamName}`;
    return { labels, title };
  }
  return { labels: ['', ''], title: event.title };
}

function buildBetRows(event: PolymarketEvent, teamLabels: [string, string]): { top: BetRow; bottom: BetRow } {
  const grouped = getMarketsGroupedByBetType({
    ...event,
    markets: event.markets.filter(market => market.active && !market.closed),
  });

  const spreadGroup = grouped.spreads.find(group => group.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.SPREADS) ?? grouped.spreads[0];
  const totalsGroup = grouped.totals.find(group => group.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.TOTALS) ?? grouped.totals[0];
  const moneylineGroup =
    grouped.moneyline.find(group => group.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE) ?? grouped.moneyline[0];

  const spreadLine = getPrimaryLine(spreadGroup);
  const totalsLine = getPrimaryLine(totalsGroup);
  const moneyline = getMoneylinePrices(moneylineGroup, teamLabels);

  const spreadLineValue = spreadLine?.value;
  const totalsLineValue = totalsLine?.value;
  const spreadOutcomeIndexes = getOutcomeIndexes(spreadLine?.market, teamLabels);
  const spreadTopOdds = getOutcomePrice(spreadLine?.market, spreadOutcomeIndexes.top);
  const spreadBottomOdds = getOutcomePrice(spreadLine?.market, spreadOutcomeIndexes.bottom);
  const totalsTopOdds = getOutcomePrice(totalsLine?.market, 0);
  const totalsBottomOdds = getOutcomePrice(totalsLine?.market, 1);
  const moneylineTokenIds = getMoneylineTokenIds(moneylineGroup, teamLabels);
  const spreadTopTokenId = getOutcomeTokenId(spreadLine?.market, spreadOutcomeIndexes.top);
  const spreadBottomTokenId = getOutcomeTokenId(spreadLine?.market, spreadOutcomeIndexes.bottom);
  const totalsTopTokenId = getOutcomeTokenId(totalsLine?.market, 0);
  const totalsBottomTokenId = getOutcomeTokenId(totalsLine?.market, 1);

  const hasSpread = Boolean(spreadLine && (spreadTopOdds || spreadBottomOdds));
  const hasMoneyline = Boolean(moneyline.top || moneyline.bottom);
  const hasTotals = Boolean(totalsLine && (totalsTopOdds || totalsBottomOdds));

  const top: BetRow = {};
  const bottom: BetRow = {};

  if (hasSpread) {
    top.spread = {
      label: formatSpreadLine(spreadLineValue, spreadOutcomeIndexes.top),
      odds: formatOdds(spreadTopOdds),
      outcomeTokenId: spreadTopTokenId,
    };
    bottom.spread = {
      label: formatSpreadLine(spreadLineValue, spreadOutcomeIndexes.bottom),
      odds: formatOdds(spreadBottomOdds),
      outcomeTokenId: spreadBottomTokenId,
    };
  }

  if (hasMoneyline) {
    top.moneyline = {
      label: '',
      odds: formatOdds(moneyline.top),
      outcomeTokenId: moneylineTokenIds.top,
    };
    bottom.moneyline = {
      label: '',
      odds: formatOdds(moneyline.bottom),
      outcomeTokenId: moneylineTokenIds.bottom,
    };
  }

  if (hasTotals) {
    top.total = {
      label: formatTotalLabel(totalsLineValue, true),
      odds: formatOdds(totalsTopOdds),
      outcomeTokenId: totalsTopTokenId,
    };
    bottom.total = {
      label: formatTotalLabel(totalsLineValue, false),
      odds: formatOdds(totalsBottomOdds),
      outcomeTokenId: totalsBottomTokenId,
    };
  }

  return { top, bottom };
}

function getPrimaryLine(group?: LineBasedGroup) {
  if (!group?.lines.length) return null;
  const targetLine = Math.abs(group.mainLine);
  return group.lines.find(line => Math.abs(line.value) === targetLine) ?? group.lines[0];
}

function getMoneylinePrices(group: MoneylineGroup | undefined, teamLabels: [string, string]) {
  if (!group || !group.markets.length) return { top: undefined, bottom: undefined };
  if (!group.isThreeWay) {
    const market = group.markets[0];
    const indexes = getOutcomeIndexes(market, teamLabels);
    return {
      top: getOutcomePrice(market, indexes.top),
      bottom: getOutcomePrice(market, indexes.bottom),
    };
  }

  const teamMarkets = group.markets.filter(market => !isDrawMarket(market));
  if (!teamMarkets.length) return { top: undefined, bottom: undefined };

  const topMarket = matchMarketToTeam(teamMarkets, teamLabels[0]) ?? teamMarkets[0];
  const bottomMarket = matchMarketToTeam(teamMarkets, teamLabels[1]) ?? teamMarkets[1] ?? teamMarkets[0];

  return {
    top: getOutcomePrice(topMarket, 0),
    bottom: getOutcomePrice(bottomMarket, 0),
  };
}

function matchMarketToTeam(markets: PolymarketMarket[], teamLabel: string) {
  const normalized = normalize(teamLabel);
  if (!normalized) return undefined;
  return markets.find(market => {
    const groupTitle = normalize(market.groupItemTitle ?? '');
    const question = normalize(market.question ?? '');
    return groupTitle.includes(normalized) || question.includes(normalized);
  });
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getOutcomePrice(market: PolymarketMarket | undefined, outcomeIndex: number): string | undefined {
  if (!market) return undefined;
  return market.outcomePrices?.[outcomeIndex];
}

function getOutcomeTokenId(market: PolymarketMarket | undefined, outcomeIndex: number): string | undefined {
  if (!market) return undefined;
  return market.clobTokenIds?.[outcomeIndex];
}

function getMoneylineTokenIds(group: MoneylineGroup | undefined, teamLabels: [string, string]) {
  if (!group || !group.markets.length) return { top: undefined, bottom: undefined };
  if (!group.isThreeWay) {
    const market = group.markets[0];
    const indexes = getOutcomeIndexes(market, teamLabels);
    return {
      top: getOutcomeTokenId(market, indexes.top),
      bottom: getOutcomeTokenId(market, indexes.bottom),
    };
  }

  const teamMarkets = group.markets.filter(market => !isDrawMarket(market));
  if (!teamMarkets.length) return { top: undefined, bottom: undefined };

  const topMarket = matchMarketToTeam(teamMarkets, teamLabels[0]) ?? teamMarkets[0];
  const bottomMarket = matchMarketToTeam(teamMarkets, teamLabels[1]) ?? teamMarkets[1] ?? teamMarkets[0];

  return {
    top: getOutcomeTokenId(topMarket, 0),
    bottom: getOutcomeTokenId(bottomMarket, 0),
  };
}

function getOutcomeIndexes(market: PolymarketMarket | undefined, teamLabels: [string, string]) {
  if (!market) return { top: 0, bottom: 1 };
  const topMatch = getOutcomeIndexByTeam(market, teamLabels[0]);
  const bottomMatch = getOutcomeIndexByTeam(market, teamLabels[1]);
  return resolveOutcomeIndexes(topMatch, bottomMatch);
}

function getOutcomeIndexByTeam(market: PolymarketMarket, teamLabel: string) {
  const normalized = normalize(teamLabel);
  if (!normalized || !market.outcomes?.length) return null;
  const index = market.outcomes.findIndex(outcome => {
    const normalizedOutcome = normalize(outcome);
    return normalizedOutcome.includes(normalized) || normalized.includes(normalizedOutcome);
  });
  return index === -1 ? null : index;
}

function resolveOutcomeIndexes(topMatch: number | null, bottomMatch: number | null) {
  if (topMatch == null && bottomMatch == null) return { top: 0, bottom: 1 };
  if (topMatch == null && bottomMatch != null) return { top: bottomMatch === 0 ? 1 : 0, bottom: bottomMatch };
  if (topMatch != null && bottomMatch == null) return { top: topMatch, bottom: topMatch === 0 ? 1 : 0 };
  if (topMatch === bottomMatch) return { top: topMatch ?? 0, bottom: topMatch === 0 ? 1 : 0 };
  return { top: topMatch ?? 0, bottom: bottomMatch ?? 1 };
}

function formatOdds(value?: string) {
  if (!value) return '--';
  return `${roundWorklet(toPercentageWorklet(value))}%`;
}

function formatSpreadLine(value: number | undefined, outcomeIndex: number) {
  if (value == null || Number.isNaN(value)) return '--';
  return `${outcomeIndex === 0 ? '-' : '+'}${Math.abs(value)}`;
}

function formatTotalLabel(value: number | undefined, isOver: boolean) {
  if (value == null || Number.isNaN(value)) return isOver ? 'O' : 'U';
  return `${isOver ? 'O' : 'U'} ${Math.abs(value)}`;
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

const styles = StyleSheet.create({
  betCell: {
    alignItems: 'center',
    borderRadius: 10,
    gap: 6,
    justifyContent: 'center',
    height: BET_ROW_HEIGHT,
    width: BET_ROW_WIDTH,
  },
  betRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
  },
  betsColumn: {
    alignItems: 'flex-end',
    gap: 8,
  },
  body: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  header: {
    gap: 8,
    marginBottom: 12,
  },
  rightColumn: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    marginLeft: 'auto',
  },
  scoreColumn: {
    alignItems: 'flex-end',
    gap: 8,
    width: 24,
  },
  scoreRow: {
    height: BET_ROW_HEIGHT,
    justifyContent: 'center',
  },
  skeleton: {
    borderRadius: 22,
    height: HEIGHT,
    overflow: 'hidden',
  },
  teamColumn: {
    flexShrink: 1,
    gap: 8,
  },
  teamRow: {
    height: BET_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
