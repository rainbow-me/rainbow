import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { globalColors, Text, TextShadow, useColorMode } from '@/design-system';
import {
  usePlacementCardTrackPress,
  usePlacementPredictionOutcomeTrackPress,
} from '@/features/discover/components/marketPress/marketPressContext';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import { TeamLogo } from '@/features/polymarket/components/TeamLogo';
import {
  getPolymarketSportsBetCellTokenId,
  usePolymarketSportsBetCellPress,
} from '@/features/polymarket/hooks/usePolymarketSportsBetCellPress';
import { usePolymarketSportsEventDisplay } from '@/features/polymarket/hooks/usePolymarketSportsEventDisplay';
import { getLeagueId, SPORT_LEAGUES, type LeagueId } from '@/features/polymarket/leagues';
import { type PolymarketTeamInfo } from '@/features/polymarket/types';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { parsePeriod, parseScore } from '@/features/polymarket/utils/sports';
import { formatOdds, type BetCellData, type EventBetGrid } from '@/features/polymarket/utils/sportsEventBetData';
import { getSportsEventOutcomeCellColor, type SportsEventOutcomeInfo } from '@/features/polymarket/utils/sportsEventOutcome';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';

export const SPORTS_EVENT_WIDGET_CARD_WIDTH = Math.min(384, DEVICE_WIDTH - 32);
export const SPORTS_EVENT_WIDGET_CARD_HEIGHT = 162;
export const SPORTS_EVENT_WIDGET_CARD_BORDER_RADIUS = 24;

const CARD_BORDER_GRADIENT_CONFIG = {
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
  locations: [0.02, 0.82, 1] as const,
};
const CARD_FILL_GRADIENT_CONFIG = {
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
  locations: [0.17824, 0.58889] as const,
};
const LINE_CELL_HEIGHT = 42;
const LINE_CELL_WIDTH = 76;
const MONEYLINE_CELL_WIDTH = 62;
const BET_CELL_BORDER_RADIUS = 15;
const TEAM_LOGO_SIZE = 36;

type SportsEventWidgetCardProps = {
  event: PolymarketEvent;
};

export const SportsEventWidgetCard = memo(function SportsEventWidgetCard({ event }: SportsEventWidgetCardProps) {
  const { isDarkMode } = useColorMode();
  const trackPress = usePlacementCardTrackPress();
  const leagueId = useMemo(() => getLeagueId(event.slug), [event.slug]);
  const accentColor = useMemo(() => getEventAccentColor({ event, leagueId, isDarkMode }), [event, isDarkMode, leagueId]);
  const { betGrid, gameInfo, isLive, scores, teamLabels } = usePolymarketSportsEventDisplay(event);
  const periodTitle = useMemo(() => getGameStatusTitle({ event, gameInfo, isLive }), [event, gameInfo, isLive]);
  const rows = useMemo(() => getRows(betGrid), [betGrid]);

  const cardBorderGradientColors = useMemo(
    () =>
      isDarkMode
        ? ([opacity(accentColor, 0.54), opacity(accentColor, 0.12), opacity(accentColor, 0)] as const)
        : ([opacity(accentColor, 0.28), opacity(accentColor, 0.1), opacity(accentColor, 0.04)] as const),
    [accentColor, isDarkMode]
  );
  const cardGradientColors = useMemo(
    () =>
      isDarkMode
        ? ([opacity(accentColor, 0.18), opacity(accentColor, 0)] as const)
        : ([opacity(accentColor, 0.12), opacity(accentColor, 0.02)] as const),
    [accentColor, isDarkMode]
  );

  const handlePress = useCallback(() => {
    trackPress?.({
      marketId: event.id,
      marketName: event.title,
      marketSlug: event.slug,
      marketSymbol: event.ticker,
    });
    Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { event, eventId: event.id });
  }, [event, trackPress]);

  return (
    <View style={styles.container}>
      <ButtonPressAnimation onPress={handlePress} scaleTo={0.96} style={styles.flex} wrapperStyle={styles.flex}>
        <GradientBorderView
          backgroundColor={isDarkMode ? globalColors.grey100 : globalColors.white100}
          borderGradientColors={cardBorderGradientColors}
          borderRadius={SPORTS_EVENT_WIDGET_CARD_BORDER_RADIUS}
          borderWidth={2}
          end={CARD_BORDER_GRADIENT_CONFIG.end}
          locations={CARD_BORDER_GRADIENT_CONFIG.locations}
          start={CARD_BORDER_GRADIENT_CONFIG.start}
          style={styles.card}
        >
          <LinearGradient
            colors={cardGradientColors}
            end={CARD_FILL_GRADIENT_CONFIG.end}
            locations={CARD_FILL_GRADIENT_CONFIG.locations}
            pointerEvents="none"
            start={CARD_FILL_GRADIENT_CONFIG.start}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.header}>
            <View style={styles.league}>
              <LeagueIcon eventSlug={event.slug} size={20} />
              <Text align="left" color="label" size="17pt" style={styles.compactText} weight="heavy">
                {getLeagueLabel(leagueId)}
              </Text>
            </View>
            <View style={styles.status}>
              {periodTitle ? (
                <Text align="right" color="labelTertiary" size="15pt" style={styles.statusText} weight="bold">
                  {periodTitle.toUpperCase()}
                </Text>
              ) : null}
              {isLive ? (
                <TextShadow blur={14} shadowOpacity={0.25}>
                  <Text align="right" color={{ custom: '#FF584D' }} size="15pt" style={styles.liveText} weight="heavy">
                    {i18n.t(i18n.l.predictions.sports.live).toUpperCase()}
                  </Text>
                </TextShadow>
              ) : null}
            </View>
          </View>
          <Separator />
          <TeamRow
            event={event}
            label={teamLabels[0]}
            score={scores?.teamAScore}
            team={event.teams?.[0]}
            lineBet={rows.away.line}
            moneylineBet={rows.away.moneyline}
          />
          <InsetSeparator />
          <TeamRow
            event={event}
            label={teamLabels[1]}
            score={scores?.teamBScore}
            team={event.teams?.[1]}
            lineBet={rows.home.line}
            moneylineBet={rows.home.moneyline}
          />
        </GradientBorderView>
      </ButtonPressAnimation>
    </View>
  );
});

const TeamRow = memo(function TeamRow({
  event,
  label,
  lineBet,
  moneylineBet,
  score,
  team,
}: {
  event: PolymarketEvent;
  label: string;
  lineBet?: BetCellData;
  moneylineBet?: BetCellData;
  score?: string;
  team?: PolymarketTeamInfo;
}) {
  const { isDarkMode } = useColorMode();
  const lineColor = getSportsEventOutcomeCellColor(event.markets, lineBet?.outcomeTokenId, isDarkMode, event.teams);
  const moneylineColor = getSportsEventOutcomeCellColor(event.markets, moneylineBet?.outcomeTokenId, isDarkMode, event.teams);

  return (
    <View style={styles.teamRow}>
      <View style={styles.teamInfo}>
        {team ? <TeamLogo team={team} size={TEAM_LOGO_SIZE} borderRadius={2} /> : <View style={styles.logoPlaceholder} />}
        <Text align="left" color="label" numberOfLines={1} size="17pt" style={styles.teamName} weight="bold">
          {label}
        </Text>
      </View>
      <View style={styles.betInfo}>
        <Text align="right" color="label" size="17pt" style={styles.score} weight="heavy">
          {score ?? ''}
        </Text>
        <View style={styles.betCells}>
          {lineBet ? (
            <WidgetBetCell event={event} data={lineBet} backgroundColor={lineColor} variant="line" />
          ) : (
            <View style={styles.lineCellSpacer} />
          )}
          {moneylineBet ? (
            <WidgetBetCell event={event} data={moneylineBet} backgroundColor={moneylineColor} variant="moneyline" />
          ) : (
            <View style={styles.moneylineCellSpacer} />
          )}
        </View>
      </View>
    </View>
  );
});

const WidgetBetCell = memo(function WidgetBetCell({
  backgroundColor,
  data,
  event,
  variant,
}: {
  backgroundColor?: string;
  data: BetCellData;
  event: PolymarketEvent;
  variant: 'line' | 'moneyline';
}) {
  const tokenId = getPolymarketSportsBetCellTokenId(data.outcomeTokenId);
  const color = backgroundColor ?? '#717784';
  const onPress = useOutcomePress({ event, outcomeTokenId: data.outcomeTokenId });
  const isLine = variant === 'line';
  const buttonStyle = isLine ? styles.lineCellButton : styles.moneylineCellButton;
  const cellStyle = isLine
    ? [styles.betCell, styles.lineCell, { backgroundColor: opacity(color, 0.22), borderColor: opacity(color, 0.12), shadowColor: color }]
    : [styles.betCell, styles.moneylineCell, { backgroundColor: color }];
  const oddsSize = isLine ? '15pt' : '17pt';

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.92} style={buttonStyle}>
      <View style={cellStyle}>
        {isLine ? null : <View style={styles.betCellOverlay} pointerEvents="none" />}
        {data.label ? (
          <Text
            align="center"
            color={{ custom: opacity(globalColors.white100, isLine ? 0.6 : 0.72) }}
            numberOfLines={1}
            size={isLine ? '13pt' : '12pt'}
            style={styles.lineLabel}
            weight="heavy"
          >
            {data.label}
          </Text>
        ) : null}
        <LiveTokenText
          align="center"
          autoSubscriptionEnabled={false}
          color={{ custom: '#FFFFFF' }}
          initialValue={data.odds}
          numberOfLines={1}
          selector={token => formatOdds(token.price)}
          size={oddsSize}
          style={isLine ? styles.lineOdds : styles.moneylineOdds}
          tokenId={tokenId}
          weight="heavy"
        />
      </View>
    </ButtonPressAnimation>
  );
});

function Separator() {
  return <View style={styles.separator} />;
}

function InsetSeparator() {
  return (
    <View style={styles.insetSeparator}>
      <View style={styles.insetSeparatorLine} />
    </View>
  );
}

function useOutcomePress({ event, outcomeTokenId }: { event: PolymarketEvent; outcomeTokenId?: string }) {
  const trackOutcomePress = usePlacementPredictionOutcomeTrackPress();
  const onResolvedOutcomePress = useCallback(
    (outcomeInfo: SportsEventOutcomeInfo) => {
      trackOutcomePress?.({
        marketId: outcomeInfo.market.id,
        marketName: outcomeInfo.market.question,
        marketSlug: outcomeInfo.market.slug,
        outcome: outcomeInfo.outcome,
      });
    },
    [trackOutcomePress]
  );

  return usePolymarketSportsBetCellPress({ event, outcomeTokenId, onResolvedOutcomePress });
}

function getRows(betGrid: EventBetGrid) {
  return {
    away: {
      line: betGrid.totals.over ?? betGrid.teamBets.away.spread,
      moneyline: betGrid.teamBets.away.moneyline,
    },
    home: {
      line: betGrid.totals.under ?? betGrid.teamBets.home.spread,
      moneyline: betGrid.teamBets.home.moneyline,
    },
  };
}

function getGameStatusTitle({
  event,
  gameInfo,
  isLive,
}: {
  event: PolymarketEvent;
  gameInfo: ReturnType<typeof usePolymarketSportsEventDisplay>['gameInfo'];
  isLive: boolean;
}) {
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

function getLeagueLabel(leagueId: LeagueId | undefined) {
  if (!leagueId) return '';
  return SPORT_LEAGUES[leagueId]?.name ?? leagueId.toUpperCase();
}

function getEventAccentColor({ event, isDarkMode, leagueId }: { event: PolymarketEvent; isDarkMode: boolean; leagueId?: LeagueId }) {
  const leagueColor = leagueId ? SPORT_LEAGUES[leagueId]?.color : undefined;
  if (leagueColor) return getColorValueForThemeWorklet(leagueColor, isDarkMode);
  return getColorValueForThemeWorklet(event.color, isDarkMode);
}

const styles = StyleSheet.create({
  container: {
    height: SPORTS_EVENT_WIDGET_CARD_HEIGHT,
    width: SPORTS_EVENT_WIDGET_CARD_WIDTH,
  },
  flex: {
    flex: 1,
  },
  card: {
    flex: 1,
    paddingBottom: 6,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  league: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  status: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  compactText: {
    letterSpacing: 0.37,
    lineHeight: 18,
  },
  statusText: {
    letterSpacing: 0.44,
    lineHeight: 16,
  },
  liveText: {
    letterSpacing: 0.44,
    lineHeight: 16,
  },
  separator: {
    backgroundColor: opacity('#F5F8FF', 0.06),
    height: 1,
    width: '100%',
  },
  insetSeparator: {
    flexDirection: 'row',
    paddingRight: 12,
  },
  insetSeparatorLine: {
    backgroundColor: opacity('#F5F8FF', 0.06),
    flex: 1,
    height: 1,
    marginLeft: 64,
  },
  teamRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 54,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  teamInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  logoPlaceholder: {
    height: TEAM_LOGO_SIZE,
    width: TEAM_LOGO_SIZE,
  },
  teamName: {
    flexShrink: 1,
    letterSpacing: 0.37,
    lineHeight: 18,
  },
  betInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  score: {
    letterSpacing: 0.37,
    lineHeight: 18,
    minWidth: 16,
  },
  betCells: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  betCell: {
    alignItems: 'center',
    borderRadius: BET_CELL_BORDER_RADIUS,
    borderWidth: 2,
    height: LINE_CELL_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  lineCell: {
    width: LINE_CELL_WIDTH,
  },
  lineCellButton: {
    borderRadius: BET_CELL_BORDER_RADIUS,
    height: LINE_CELL_HEIGHT,
    width: LINE_CELL_WIDTH,
  },
  moneylineCell: {
    borderColor: opacity(globalColors.white100, 0.1),
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    width: MONEYLINE_CELL_WIDTH,
  },
  moneylineCellButton: {
    borderRadius: BET_CELL_BORDER_RADIUS,
    height: LINE_CELL_HEIGHT,
    width: MONEYLINE_CELL_WIDTH,
  },
  betCellOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: opacity(globalColors.grey100, 0.3),
    borderRadius: BET_CELL_BORDER_RADIUS,
  },
  lineCellSpacer: {
    height: LINE_CELL_HEIGHT,
    width: LINE_CELL_WIDTH,
  },
  moneylineCellSpacer: {
    height: LINE_CELL_HEIGHT,
    width: MONEYLINE_CELL_WIDTH,
  },
  lineLabel: {
    left: 0,
    letterSpacing: 0.72,
    lineHeight: 13,
    position: 'absolute',
    right: 0,
    top: 6,
  },
  lineOdds: {
    bottom: 6,
    left: 0,
    letterSpacing: 0.36,
    lineHeight: 16,
    position: 'absolute',
    right: 0,
  },
  moneylineOdds: {
    letterSpacing: 0.36,
    lineHeight: 20,
    textShadowColor: opacity(globalColors.grey100, 0.15),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
});
