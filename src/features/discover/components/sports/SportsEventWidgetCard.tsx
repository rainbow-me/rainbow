import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { globalColors, Text, TextShadow, useColorMode } from '@/design-system';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import { TeamLogo } from '@/features/polymarket/components/TeamLogo';
import { usePolymarketLiveGame } from '@/features/polymarket/hooks/usePolymarketLiveGame';
import { getLeagueId, SPORT_LEAGUES, type LeagueId } from '@/features/polymarket/leagues';
import { type PolymarketTeamInfo } from '@/features/polymarket/types';
import { type PolymarketEvent, type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { parsePeriod, parseScore, selectGameInfo } from '@/features/polymarket/utils/sports';
import { buildEventBetGrid, formatOdds, type BetCellData } from '@/features/polymarket/utils/sportsEventBetData';
import { getTeamDisplayInfo } from '@/features/polymarket/utils/sportsEventTeams';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';

export const SPORTS_EVENT_WIDGET_CARD_WIDTH = Math.min(356, DEVICE_WIDTH - 64);
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
const TEAM_LOGO_SIZE = 36;

type SportsEventWidgetCardProps = {
  event: PolymarketEvent;
  style?: StyleProp<ViewStyle>;
};

export const SportsEventWidgetCard = memo(function SportsEventWidgetCard({ event, style }: SportsEventWidgetCardProps) {
  const { isDarkMode } = useColorMode();
  const leagueId = useMemo(() => getLeagueId(event.slug), [event.slug]);
  const accentColor = useMemo(() => getEventAccentColor({ event, leagueId, isDarkMode }), [event, isDarkMode, leagueId]);
  const liveGame = usePolymarketLiveGame(event.live && !event.ended ? event.gameId : undefined);
  const gameInfo = useMemo(() => selectGameInfo({ event, liveGame }), [event, liveGame]);
  const isLive = gameInfo.live && !gameInfo.ended;
  const { labels: teamLabels } = useMemo(() => getTeamDisplayInfo(event), [event]);
  const scores = useMemo(() => (gameInfo.score ? parseScore(gameInfo.score) : null), [gameInfo.score]);
  const periodTitle = useMemo(() => getGameStatusTitle({ event, gameInfo, isLive }), [event, gameInfo, isLive]);
  const rows = useMemo(() => getRows(event), [event]);

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
    Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { event, eventId: event.id });
  }, [event]);

  return (
    <View style={[styles.container, style]}>
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
  const lineColor = getBetCellColor(event.markets, lineBet?.outcomeTokenId, isDarkMode, event.teams);
  const moneylineColor = getBetCellColor(event.markets, moneylineBet?.outcomeTokenId, isDarkMode, event.teams);

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
          {lineBet ? <LineBetCell event={event} data={lineBet} backgroundColor={lineColor} /> : <View style={styles.lineCellSpacer} />}
          {moneylineBet ? (
            <MoneylineBetCell event={event} data={moneylineBet} backgroundColor={moneylineColor} />
          ) : (
            <View style={styles.moneylineCellSpacer} />
          )}
        </View>
      </View>
    </View>
  );
});

const LineBetCell = memo(function LineBetCell({
  backgroundColor,
  data,
  event,
}: {
  backgroundColor?: string;
  data: BetCellData;
  event: PolymarketEvent;
}) {
  const tokenId = getPolymarketTokenId(data.outcomeTokenId, 'sell');
  const color = backgroundColor ?? '#717784';
  const onPress = useOutcomePress({ event, outcomeTokenId: data.outcomeTokenId });

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.92}>
      <View style={[styles.lineCell, { backgroundColor: opacity(color, 0.2), borderColor: opacity(color, 0.06), shadowColor: color }]}>
        <Text
          align="center"
          color={{ custom: opacity(globalColors.white100, 0.6) }}
          numberOfLines={1}
          size="13pt"
          style={styles.lineLabel}
          weight="heavy"
        >
          {data.label}
        </Text>
        <LiveTokenText
          align="center"
          autoSubscriptionEnabled={false}
          color={{ custom: '#FFFFFF' }}
          initialValue={data.odds}
          numberOfLines={1}
          selector={token => formatOdds(token.price)}
          size="15pt"
          style={styles.lineOdds}
          tokenId={tokenId}
          weight="heavy"
        />
      </View>
    </ButtonPressAnimation>
  );
});

const MoneylineBetCell = memo(function MoneylineBetCell({
  backgroundColor,
  data,
  event,
}: {
  backgroundColor?: string;
  data: BetCellData;
  event: PolymarketEvent;
}) {
  const tokenId = getPolymarketTokenId(data.outcomeTokenId, 'sell');
  const color = backgroundColor ?? '#717784';
  const onPress = useOutcomePress({ event, outcomeTokenId: data.outcomeTokenId });

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.92}>
      <View style={[styles.moneylineCell, { backgroundColor: color }]}>
        <View style={styles.moneylineOverlay} pointerEvents="none" />
        <LiveTokenText
          align="center"
          autoSubscriptionEnabled={false}
          color={{ custom: '#FFFFFF' }}
          initialValue={data.odds}
          numberOfLines={1}
          selector={token => formatOdds(token.price)}
          size="17pt"
          style={styles.moneylineOdds}
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
  const { isDarkMode } = useColorMode();

  return useCallback(() => {
    const outcomeInfo = getOutcomeInfoForTokenId(event.markets, outcomeTokenId);
    if (!outcomeInfo) return;

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
  }, [event, isDarkMode, outcomeTokenId]);
}

function getRows(event: PolymarketEvent) {
  const betGrid = buildEventBetGrid(event);
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
  gameInfo: ReturnType<typeof selectGameInfo>;
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

function getOutcomeInfoForTokenId(markets: PolymarketMarket[], outcomeTokenId?: string) {
  if (!outcomeTokenId) return null;
  for (const market of markets) {
    const outcomeIndex = market.clobTokenIds.indexOf(outcomeTokenId);
    if (outcomeIndex >= 0) {
      const outcome = market.groupItemTitle || market.outcomes[outcomeIndex] || '';
      return { market, outcomeIndex, outcome };
    }
  }
  return null;
}

function getBetCellColor(
  markets: PolymarketMarket[],
  outcomeTokenId: string | undefined,
  isDarkMode: boolean,
  teams: PolymarketEvent['teams']
) {
  const outcomeInfo = getOutcomeInfoForTokenId(markets, outcomeTokenId);
  if (!outcomeInfo) return undefined;

  return getOutcomeColor({
    market: outcomeInfo.market,
    outcome: outcomeInfo.outcome,
    outcomeIndex: outcomeInfo.outcomeIndex,
    isDarkMode,
    teams,
  });
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
  lineCell: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 2,
    height: LINE_CELL_HEIGHT,
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    width: LINE_CELL_WIDTH,
  },
  moneylineCell: {
    alignItems: 'center',
    borderColor: opacity(globalColors.white100, 0.1),
    borderRadius: 15,
    borderWidth: 2,
    height: LINE_CELL_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    width: MONEYLINE_CELL_WIDTH,
  },
  moneylineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: opacity(globalColors.grey100, 0.3),
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
