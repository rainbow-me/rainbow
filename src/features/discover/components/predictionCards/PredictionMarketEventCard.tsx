import { memo, useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { globalColors, Text, TextShadow, useColorMode } from '@/design-system';
import {
  usePlacementCardTrackPress,
  usePlacementPredictionOutcomeTrackPress,
} from '@/features/discover/components/marketPress/marketPressContext';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import {
  SportsEventContent,
  type SportsEventRows,
} from '@/features/polymarket/components/polymarket-sport-event-list-item/SportsEventContent';
import { TeamLogo } from '@/features/polymarket/components/TeamLogo';
import {
  getPolymarketSportsBetCellTokenId,
  usePolymarketSportsBetCellPress,
} from '@/features/polymarket/hooks/usePolymarketSportsBetCellPress';
import { SPORT_LEAGUES, type LeagueId } from '@/features/polymarket/leagues';
import { type PolymarketTeamInfo } from '@/features/polymarket/types';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { formatOdds, type BetCellData } from '@/features/polymarket/utils/sportsEventBetData';
import { getSportsEventOutcomeCellColor, type SportsEventOutcomeInfo } from '@/features/polymarket/utils/sportsEventOutcome';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export const PREDICTION_MARKET_EVENT_CARD_WIDTH = Math.min(384, DEVICE_WIDTH - 32);
export const PREDICTION_MARKET_EVENT_CARD_CAROUSEL_WIDTH = Math.min(356, DEVICE_WIDTH - 64);
export const PREDICTION_MARKET_EVENT_CARD_HEIGHT = 162;
export const PREDICTION_MARKET_EVENT_CARD_BORDER_RADIUS = 24;

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

type PredictionMarketEventCardProps = {
  event: PolymarketEvent;
  width?: number;
};

export const PredictionMarketEventCard = memo(function PredictionMarketEventCard({
  event,
  width = PREDICTION_MARKET_EVENT_CARD_WIDTH,
}: PredictionMarketEventCardProps) {
  const { isDarkMode } = useColorMode();
  const trackPress = usePlacementCardTrackPress();
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
    <SportsEventContent event={event}>
      {({ eventAccentColor, gameStatusTitle, isLive, leagueId, rows, scores, teamLabels }) => {
        const cardBorderGradientColors = getPredictionEventCardBorderGradientColors(eventAccentColor, isDarkMode);
        const cardGradientColors = getPredictionEventCardGradientColors(eventAccentColor, isDarkMode);

        return (
          <View style={[styles.container, { width }]}>
            {Platform.OS === 'android' ? <WidgetBetCellsOverlay event={event} rows={rows} /> : null}
            <ButtonPressAnimation onPress={handlePress} scaleTo={0.96} style={styles.flex} wrapperStyle={styles.flex}>
              <GradientBorderView
                backgroundColor={isDarkMode ? globalColors.grey100 : globalColors.white100}
                borderGradientColors={cardBorderGradientColors}
                borderRadius={PREDICTION_MARKET_EVENT_CARD_BORDER_RADIUS}
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
                    {gameStatusTitle ? (
                      <Text align="right" color="labelTertiary" size="15pt" style={styles.statusText} weight="bold">
                        {gameStatusTitle.toUpperCase()}
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
                  label={rows.away.label ?? teamLabels[0]}
                  score={scores?.teamAScore}
                  team={event.teams?.[0]}
                  lineBet={rows.away.line}
                  moneylineBet={rows.away.moneyline}
                  compact={rows.away.isFallback}
                  interactiveBetCells={Platform.OS === 'ios'}
                />
                <InsetSeparator />
                <TeamRow
                  event={event}
                  label={rows.home.label ?? teamLabels[1]}
                  score={scores?.teamBScore}
                  team={event.teams?.[1]}
                  lineBet={rows.home.line}
                  moneylineBet={rows.home.moneyline}
                  compact={rows.home.isFallback}
                  interactiveBetCells={Platform.OS === 'ios'}
                />
              </GradientBorderView>
            </ButtonPressAnimation>
          </View>
        );
      }}
    </SportsEventContent>
  );
});

function getPredictionEventCardBorderGradientColors(eventAccentColor: string, isDarkMode: boolean) {
  return isDarkMode
    ? ([opacity(eventAccentColor, 0.54), opacity(eventAccentColor, 0.12), opacity(eventAccentColor, 0)] as const)
    : ([opacity(eventAccentColor, 0.28), opacity(eventAccentColor, 0.1), opacity(eventAccentColor, 0.04)] as const);
}

function getPredictionEventCardGradientColors(eventAccentColor: string, isDarkMode: boolean) {
  return isDarkMode
    ? ([opacity(eventAccentColor, 0.18), opacity(eventAccentColor, 0)] as const)
    : ([opacity(eventAccentColor, 0.12), opacity(eventAccentColor, 0.02)] as const);
}

const TeamRow = memo(function TeamRow({
  event,
  label,
  lineBet,
  moneylineBet,
  compact,
  score,
  team,
  interactiveBetCells = true,
}: {
  event: PolymarketEvent;
  compact?: boolean;
  interactiveBetCells?: boolean;
  label: string;
  lineBet?: BetCellData;
  moneylineBet?: BetCellData;
  score?: string;
  team?: PolymarketTeamInfo;
}) {
  return (
    <View style={styles.teamRow}>
      <View style={styles.teamInfo}>
        {team ? <TeamLogo team={team} size={TEAM_LOGO_SIZE} borderRadius={2} /> : <TeamFallbackIcon eventSlug={event.slug} />}
        <Text align="left" color="label" numberOfLines={1} size="17pt" style={styles.teamName} weight="bold">
          {label}
        </Text>
      </View>
      <View style={styles.betInfo}>
        {score || !compact ? (
          <Text align="right" color="label" size="17pt" style={styles.score} weight="heavy">
            {score ?? ''}
          </Text>
        ) : null}
        <TeamBetCells event={event} compact={compact} interactive={interactiveBetCells} lineBet={lineBet} moneylineBet={moneylineBet} />
      </View>
    </View>
  );
});

function TeamFallbackIcon({ eventSlug }: { eventSlug: string }) {
  return (
    <View style={styles.teamFallbackIcon}>
      <LeagueIcon eventSlug={eventSlug} size={26} />
    </View>
  );
}

const WidgetBetCellsOverlay = memo(function WidgetBetCellsOverlay({ event, rows }: { event: PolymarketEvent; rows: SportsEventRows }) {
  return (
    <View pointerEvents="box-none" style={styles.betCellsOverlay}>
      <TeamBetCells event={event} compact={rows.away.isFallback} lineBet={rows.away.line} moneylineBet={rows.away.moneyline} />
      <TeamBetCells event={event} compact={rows.home.isFallback} lineBet={rows.home.line} moneylineBet={rows.home.moneyline} />
    </View>
  );
});

const TeamBetCells = memo(function TeamBetCells({
  event,
  compact,
  interactive = true,
  lineBet,
  moneylineBet,
}: {
  event: PolymarketEvent;
  compact?: boolean;
  interactive?: boolean;
  lineBet?: BetCellData;
  moneylineBet?: BetCellData;
}) {
  const { isDarkMode } = useColorMode();
  const lineColor = getSportsEventOutcomeCellColor(event.markets, lineBet?.outcomeTokenId, isDarkMode, event.teams);
  const moneylineColor = getSportsEventOutcomeCellColor(event.markets, moneylineBet?.outcomeTokenId, isDarkMode, event.teams);

  if (!interactive) {
    return (
      <View style={styles.betCells}>
        {lineBet ? <View style={styles.lineCellButton} /> : compact ? null : <View style={styles.lineCellSpacer} />}
        {moneylineBet ? <View style={styles.moneylineCellButton} /> : compact ? null : <View style={styles.moneylineCellSpacer} />}
      </View>
    );
  }

  return (
    <View style={styles.betCells}>
      {lineBet ? (
        <WidgetBetCell event={event} data={lineBet} backgroundColor={lineColor} variant="line" />
      ) : compact ? null : (
        <View style={styles.lineCellSpacer} />
      )}
      {moneylineBet ? (
        <WidgetBetCell event={event} data={moneylineBet} backgroundColor={moneylineColor} variant="moneyline" />
      ) : compact ? null : (
        <View style={styles.moneylineCellSpacer} />
      )}
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

  const content = (
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
  );

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.92} style={buttonStyle}>
      {content}
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

function getLeagueLabel(leagueId: LeagueId | undefined) {
  if (!leagueId) return '';
  return SPORT_LEAGUES[leagueId]?.name ?? leagueId.toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    height: PREDICTION_MARKET_EVENT_CARD_HEIGHT,
    position: 'relative',
    width: PREDICTION_MARKET_EVENT_CARD_WIDTH,
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
  teamFallbackIcon: {
    alignItems: 'center',
    height: TEAM_LOGO_SIZE,
    justifyContent: 'center',
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
  betCellsOverlay: {
    gap: 13,
    position: 'absolute',
    right: 12,
    top: 51,
    zIndex: 1,
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
