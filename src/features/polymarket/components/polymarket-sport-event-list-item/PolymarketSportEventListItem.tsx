import { memo, useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Text, TextShadow, useBackgroundColor, useColorMode, useForegroundColor } from '@/design-system';
import { usePolymarketLiveGame } from '@/features/polymarket/hooks/usePolymarketLiveGame';
import { PolymarketEvent, PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { parsePeriod, parseScore, selectGameInfo, type PolymarketEventGameInfo } from '@/features/polymarket/utils/sports';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';
import { buildBetRows, formatOdds, getTeamDisplayInfo, type BetCellData } from '@/features/polymarket/utils/getSportsEventTokenIds';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { TeamLogo } from '@/features/polymarket/components/TeamLogo';

const BET_ROW_HEIGHT = 38;
const BET_ROW_WIDTH = 60;
const BET_CELL_GAP = 6;
const LOGO_SIZE = 28;

export const HEIGHT = 176;

export const PolymarketSportEventListItem = memo(function PolymarketSportEventListItem({
  event,
  style,
}: {
  event: PolymarketEvent;
  style?: StyleProp<ViewStyle>;
}) {
  const cardBackground = useBackgroundColor('fillQuaternary');
  const fillTertiary = useBackgroundColor('fillTertiary');
  const borderColor = useForegroundColor('separatorSecondary');
  const { isDarkMode } = useColorMode();

  const liveGame = usePolymarketLiveGame(event.live && !event.ended ? event.gameId : undefined);
  const gameInfo = useMemo(() => selectGameInfo({ event, liveGame }), [event, liveGame]);
  const isLive = gameInfo.live && !gameInfo.ended;
  const { labels: teamLabels, title } = useMemo(() => getTeamDisplayInfo(event), [event]);
  const scores = useMemo(() => (isLive ? (gameInfo.score ? parseScore(gameInfo.score) : null) : null), [gameInfo.score, isLive]);
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
  const betRows = useMemo(() => buildBetRows(event, teamLabels), [event, teamLabels]);
  const showScores = isLive || gameInfo.ended;
  const topMoneylineOutcome = getOutcomeInfoForTokenId(event.markets, betRows.top.moneyline?.outcomeTokenId);
  const bottomMoneylineOutcome = getOutcomeInfoForTokenId(event.markets, betRows.bottom.moneyline?.outcomeTokenId);
  const topMoneylineColor = topMoneylineOutcome
    ? getOutcomeColor({
        market: topMoneylineOutcome.market,
        outcome: topMoneylineOutcome.outcome,
        outcomeIndex: topMoneylineOutcome.outcomeIndex,
        isDarkMode,
        teams: event.teams,
      })
    : undefined;
  const bottomMoneylineColor = bottomMoneylineOutcome
    ? getOutcomeColor({
        market: bottomMoneylineOutcome.market,
        outcome: bottomMoneylineOutcome.outcome,
        outcomeIndex: bottomMoneylineOutcome.outcomeIndex,
        isDarkMode,
        teams: event.teams,
      })
    : undefined;

  const teamLabelFontSize = useMemo(() => (teamLabels[0].length > 14 || teamLabels[1].length > 14 ? '10pt' : '13pt'), [teamLabels]);

  const createBetCellPressHandler = useCallback(
    (outcomeTokenId?: string) => {
      if (!outcomeTokenId) return undefined;
      const outcomeInfo = getOutcomeInfoForTokenId(event.markets, outcomeTokenId);
      if (!outcomeInfo) return undefined;

      return () => {
        const outcomeColor = getOutcomeColor({
          market: outcomeInfo.market,
          outcome: outcomeInfo.outcome,
          outcomeIndex: outcomeInfo.outcomeIndex,
          isDarkMode,
          teams: event.teams,
        });
        Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, {
          market: outcomeInfo.market,
          event,
          outcomeIndex: outcomeInfo.outcomeIndex,
          outcomeColor,
          fromRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN,
        });
      };
    },
    [event, isDarkMode]
  );

  return (
    <ButtonPressAnimation onPress={() => navigateToEvent(event)} scaleTo={0.98} style={style}>
      <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.header}>
          <Text align="left" color="label" size="13pt" weight="heavy" numberOfLines={2}>
            {title}
          </Text>
          {isLive ? (
            <View style={styles.liveIndicator}>
              <View style={styles.liveIndicatorLeft}>
                <View style={styles.liveDot} />
                <TextShadow blur={10} shadowOpacity={0.5}>
                  <Text align="center" size="10pt" style={{ letterSpacing: 0.6 }} weight="heavy" color={{ custom: '#FF584D' }}>
                    {i18n.t(i18n.l.predictions.sports.live).toUpperCase()}
                  </Text>
                </TextShadow>
              </View>
              <View style={[styles.periodPill, { backgroundColor: fillTertiary, borderColor }]}>
                <Text align="right" size="10pt" weight="bold" color="labelTertiary">
                  {periodTitle}
                </Text>
              </View>
            </View>
          ) : subtitle ? (
            <Text align="left" color="labelSecondary" size="10pt" weight="bold" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.body}>
          <View style={styles.teamColumn}>
            <View style={styles.teamRow}>
              {event.teams?.[0] && <TeamLogo team={event.teams?.[0]} size={LOGO_SIZE} borderRadius={4} />}
              <Text align="left" color="label" size={teamLabelFontSize} weight="bold" numberOfLines={1}>
                {teamLabels[0]}
              </Text>
            </View>
            <View style={styles.teamRow}>
              {event.teams?.[1] && <TeamLogo team={event.teams?.[1]} size={LOGO_SIZE} borderRadius={4} />}
              <Text align="left" color="label" size={teamLabelFontSize} weight="bold" numberOfLines={1}>
                {teamLabels[1]}
              </Text>
            </View>
          </View>
          <View style={styles.rightColumn}>
            {showScores ? (
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
                {betRows.top.spread && (
                  <BetCell data={betRows.top.spread} onPress={createBetCellPressHandler(betRows.top.spread.outcomeTokenId)} />
                )}
                {betRows.top.total && (
                  <BetCell data={betRows.top.total} onPress={createBetCellPressHandler(betRows.top.total.outcomeTokenId)} />
                )}
                {betRows.top.moneyline && (
                  <BetCell
                    data={betRows.top.moneyline}
                    backgroundColor={topMoneylineColor}
                    onPress={createBetCellPressHandler(betRows.top.moneyline.outcomeTokenId)}
                  />
                )}
              </View>
              <View style={styles.betRow}>
                {betRows.bottom.spread && (
                  <BetCell data={betRows.bottom.spread} onPress={createBetCellPressHandler(betRows.bottom.spread.outcomeTokenId)} />
                )}
                {betRows.bottom.total && (
                  <BetCell data={betRows.bottom.total} onPress={createBetCellPressHandler(betRows.bottom.total.outcomeTokenId)} />
                )}
                {betRows.bottom.moneyline && (
                  <BetCell
                    data={betRows.bottom.moneyline}
                    backgroundColor={bottomMoneylineColor}
                    onPress={createBetCellPressHandler(betRows.bottom.moneyline.outcomeTokenId)}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </ButtonPressAnimation>
  );
});

const BetCell = memo(function BetCell({
  data,
  backgroundColor,
  onPress,
}: {
  data: BetCellData;
  backgroundColor?: string;
  onPress?: () => void;
}) {
  const fillTertiary = useBackgroundColor('fillTertiary');
  const hasLabel = Boolean(data.label);
  const tokenId = data.outcomeTokenId ? getPolymarketTokenId(data.outcomeTokenId, 'sell') : undefined;

  const content = (
    <View style={[styles.betCell, { backgroundColor: backgroundColor ?? fillTertiary }]}>
      {hasLabel ? (
        <Text align="center" color="labelSecondary" size="12pt" weight="bold" numberOfLines={1}>
          {data.label}
        </Text>
      ) : null}
      {tokenId ? (
        <LiveTokenText
          align="center"
          color={backgroundColor ? 'white' : 'label'}
          size={hasLabel ? '12pt' : '15pt'}
          weight="heavy"
          numberOfLines={1}
          tokenId={tokenId}
          initialValue={data.odds}
          selector={token => formatOdds(token.price)}
          autoSubscriptionEnabled={false}
        />
      ) : (
        <Text align="center" color={backgroundColor ? 'white' : 'label'} size={hasLabel ? '12pt' : '15pt'} weight="heavy" numberOfLines={1}>
          {data.odds}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <ButtonPressAnimation onPress={onPress} scaleTo={0.92}>
        {content}
      </ButtonPressAnimation>
    );
  }

  return content;
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

function getOutcomeInfoForTokenId(markets: PolymarketMarket[], outcomeTokenId?: string) {
  if (!outcomeTokenId) return null;
  for (const market of markets) {
    const index = market.clobTokenIds.indexOf(outcomeTokenId);
    if (index >= 0) {
      const outcome = market.groupItemTitle || market.outcomes[index] || '';
      return { market, outcomeIndex: index, outcome };
    }
  }
  return null;
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
  liveDot: {
    backgroundColor: '#FF584D',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  liveIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  liveIndicatorLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  periodPill: {
    borderRadius: 8,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  betRow: {
    flexDirection: 'row',
    gap: BET_CELL_GAP,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
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
