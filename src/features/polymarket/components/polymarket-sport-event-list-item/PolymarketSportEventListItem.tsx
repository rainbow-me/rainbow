import { memo } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import ConditionalWrap from 'conditional-wrap';
import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Text, TextShadow, useBackgroundColor, useColorMode } from '@/design-system';
import { TeamLogo } from '@/features/polymarket/components/TeamLogo';
import {
  getPolymarketSportsBetCellTokenId,
  usePolymarketSportsBetCellPress,
} from '@/features/polymarket/hooks/usePolymarketSportsBetCellPress';
import { useSportsEventContent } from '@/features/polymarket/hooks/useSportsEventContent';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { formatOdds, type BetCellData } from '@/features/polymarket/utils/sportsEventBetData';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

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
  const {
    awayBets,
    awayMoneylineColor,
    awaySpreadColor,
    betCellsPlaceholder,
    borderColor,
    cardBackground,
    cardGradientColors,
    fillTertiary,
    homeBets,
    homeMoneylineColor,
    homeSpreadColor,
    isLive,
    periodTitle,
    scores,
    showScores,
    subtitle,
    teamLabelFontSize,
    teamLabels,
    title,
    totals,
    totalsOverColor,
    totalsUnderColor,
  } = useSportsEventContent(event);

  return (
    <ConditionalWrap condition={Platform.OS === 'android'} wrap={children => <View style={[styles.container, style]}>{children}</View>}>
      <>
        {Platform.OS === 'android' && (
          <View style={styles.betCellsOverlay}>
            <View style={styles.betsColumn}>
              <View style={styles.betRow}>
                {awayBets.spread && <BetCell event={event} data={awayBets.spread} backgroundColor={awaySpreadColor} />}
                {totals.over && <BetCell event={event} data={totals.over} backgroundColor={totalsOverColor} />}
                {awayBets.moneyline && <BetCell event={event} data={awayBets.moneyline} backgroundColor={awayMoneylineColor} />}
              </View>
              <View style={styles.betRow}>
                {homeBets.spread && <BetCell event={event} data={homeBets.spread} backgroundColor={homeSpreadColor} />}
                {totals.under && <BetCell event={event} data={totals.under} backgroundColor={totalsUnderColor} />}
                {homeBets.moneyline && <BetCell event={event} data={homeBets.moneyline} backgroundColor={homeMoneylineColor} />}
              </View>
            </View>
          </View>
        )}
        <ButtonPressAnimation onPress={() => navigateToEvent(event)} scaleTo={0.98} style={Platform.OS === 'ios' ? style : undefined}>
          <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
            <LinearGradient
              colors={cardGradientColors}
              pointerEvents="none"
              start={{ x: 0, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
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
                {Platform.OS === 'ios' ? (
                  <View style={styles.betsColumn}>
                    <View style={styles.betRow}>
                      {awayBets.spread && <BetCell event={event} data={awayBets.spread} backgroundColor={awaySpreadColor} />}
                      {totals.over && <BetCell event={event} data={totals.over} backgroundColor={totalsOverColor} />}
                      {awayBets.moneyline && <BetCell event={event} data={awayBets.moneyline} backgroundColor={awayMoneylineColor} />}
                    </View>
                    <View style={styles.betRow}>
                      {homeBets.spread && <BetCell event={event} data={homeBets.spread} backgroundColor={homeSpreadColor} />}
                      {totals.under && <BetCell event={event} data={totals.under} backgroundColor={totalsUnderColor} />}
                      {homeBets.moneyline && <BetCell event={event} data={homeBets.moneyline} backgroundColor={homeMoneylineColor} />}
                    </View>
                  </View>
                ) : (
                  <View style={{ width: betCellsPlaceholder.width, height: betCellsPlaceholder.height }} />
                )}
              </View>
            </View>
          </View>
        </ButtonPressAnimation>
      </>
    </ConditionalWrap>
  );
});

const BetCell = memo(function BetCell({
  data,
  backgroundColor,
  event,
}: {
  data: BetCellData;
  backgroundColor?: string;
  event: PolymarketEvent;
}) {
  const fillTertiary = useBackgroundColor('fillTertiary');
  const hasLabel = Boolean(data.label);
  const tokenId = getPolymarketSportsBetCellTokenId(data.outcomeTokenId);
  const onPress = usePolymarketSportsBetCellPress({ event, outcomeTokenId: data.outcomeTokenId });

  const content = (
    <View style={[styles.betCell, { backgroundColor: backgroundColor ?? fillTertiary }]}>
      {hasLabel ? (
        <Text align="center" color="labelSecondary" size="12pt" weight="bold" numberOfLines={1}>
          {data.label}
        </Text>
      ) : null}
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
  const shimmerColor = opacity(isDarkMode ? fillQuaternary : fillSecondary, isDarkMode ? 0.06 : 0.1);
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

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  betCellsOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1,
  },
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
