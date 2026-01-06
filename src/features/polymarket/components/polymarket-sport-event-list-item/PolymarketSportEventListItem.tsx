import { memo, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Text, useBackgroundColor, useColorMode, useForegroundColor } from '@/design-system';
import { usePolymarketLiveGame } from '@/features/polymarket/hooks/usePolymarketLiveGame';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { parsePeriod, parseScore, selectGameInfo, type PolymarketEventGameInfo } from '@/features/polymarket/utils/sports';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';
import { ImgixImage } from '@/components/images';
import { buildBetRows, formatOdds, getTeamDisplayInfo, type BetCellData } from '@/features/polymarket/utils/getSportsEventTokenIds';

const BET_ROW_HEIGHT = 38;
const BET_ROW_WIDTH = 60;

export const HEIGHT = 176;

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
  const showScores = isLive || gameInfo.ended;

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
          autoSubscriptionEnabled={false}
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
