import { memo, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { opacity } from '@/framework/ui/utils/opacity';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import ImgixImage from '@/components/images/ImgixImage';
import { globalColors, Separator, Text, useBackgroundColor, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
// import {
//   polymarketRecommendationsActions,
//   usePolymarketRecommendationsStore,
// } from '@/features/polymarket/stores/polymarketRecommendationsStore';
import { PolymarketEvent, PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';
import { deepFreeze } from '@/utils/deepFreeze';
import { createOpacityPalette } from '@/worklets/colors';
import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

export const HEIGHT = 224;

const GRADIENT_CONFIGS = {
  card: {
    end: { x: 0.64, y: 0.68 },
    start: { x: -0.08, y: -0.08 },
  },
  outcomePill: {
    end: { x: 0.76, y: 0 },
    locations: [0.06, 1] as const,
    start: { x: -0.06, y: 0 },
  },
  outcomePillBorder: {
    end: { x: 0.8, y: 0 },
    start: { x: -1, y: 0 },
  },
};
const OPACITIES = deepFreeze([0, 14, 16, 24]);
const LAST_TRADE_PRICE_THRESHOLDS = [0.05, 0.01];

export const PolymarketEventsListItem = memo(function PolymarketEventsListItem({
  event,
  style,
}: {
  event: PolymarketEvent;
  style?: StyleProp<ViewStyle>;
}) {
  const { isDarkMode } = useColorMode();

  const markets = useMemo(() => {
    const activeMarkets = event.markets.filter(m => m.active && !m.closed);
    const firstMarket = activeMarkets[0];
    const isGame =
      firstMarket &&
      firstMarket.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE &&
      firstMarket.outcomes[0] !== 'Yes' &&
      firstMarket.outcomes[1] !== 'No';
    const isSingleMarketEvent = activeMarkets.length === 1;
    /**
     * When the first market is a moneyline market the event represents a game
     * For games, we show the two outcomes of this market as the first and second market (excluding three-way moneyline markets)
     * We also do this when an even has only one market with Yes / No outcomes
     */
    if (isGame || isSingleMarketEvent) {
      return [
        { odds: `${roundWorklet(toPercentageWorklet(firstMarket.outcomePrices?.[0] ?? 0))}%`, title: firstMarket.outcomes[0] },
        { odds: `${roundWorklet(toPercentageWorklet(firstMarket.outcomePrices?.[1] ?? 0))}%`, title: firstMarket.outcomes[1] },
      ];
    }

    const marketsAboveThreshold = LAST_TRADE_PRICE_THRESHOLDS.map(threshold =>
      activeMarkets.filter(m => (m.lastTradePrice ?? 0) >= threshold)
    ).find(markets => markets.length >= 2);
    const marketsToShow = (marketsAboveThreshold ?? activeMarkets).slice(0, 2);

    if (marketsToShow.length === 0) {
      return [{ odds: '', title: i18n.t(i18n.l.predictions.outcomes.yes) }];
    }

    return marketsToShow.map(market => ({
      odds: `${roundWorklet(toPercentageWorklet(calculateOddsPrice(market)))}%`,
      title: market.groupItemTitle || market.outcomes[0],
    }));
  }, [event]);

  const eventColor = getColorValueForThemeWorklet(event.color, isDarkMode);
  const colors = useMemo(() => {
    const palette = createOpacityPalette(eventColor, OPACITIES);
    return {
      cardBorderGradient: isDarkMode
        ? ([palette.opacity16, palette.opacity0] as const)
        : ([globalColors.white100, globalColors.white100] as const),
      outcomePillBorderGradient: [palette.opacity16, palette.opacity0] as const,
      cardGradient: isDarkMode ? ([palette.opacity24, palette.opacity0] as const) : ([palette.opacity14, palette.opacity0] as const),
      outcomePillGradient: [eventColor, palette.opacity0] as const,
      textColor: { custom: eventColor },
    };
  }, [eventColor, isDarkMode]);

  const iconSource = useMemo(() => ({ uri: event.icon ?? event.image }), [event.icon, event.image]);

  return (
    <View style={style}>
      <ButtonPressAnimation onPress={() => navigateToEvent(event)} scaleTo={0.96}>
        <GradientBorderView
          borderGradientColors={colors.cardBorderGradient}
          borderRadius={26}
          borderWidth={2}
          end={GRADIENT_CONFIGS.card.end}
          start={GRADIENT_CONFIGS.card.start}
          style={styles.overflowHidden}
        >
          {isDarkMode ? (
            <LinearGradient
              colors={colors.cardGradient}
              style={StyleSheet.absoluteFill}
              start={GRADIENT_CONFIGS.card.start}
              end={GRADIENT_CONFIGS.card.end}
              pointerEvents="none"
            />
          ) : (
            <View style={styles.lightModeCardFill} />
          )}

          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <ImgixImage enableFasterImage source={iconSource} size={32} style={styles.icon} />
              <Text size="17pt" weight="heavy" color="label" numberOfLines={markets[1] ? 3 : 4} align="left">
                {event.title}
              </Text>
            </View>

            <GradientBorderView
              borderGradientColors={colors.outcomePillBorderGradient}
              borderWidth={2}
              start={GRADIENT_CONFIGS.outcomePillBorder.start}
              end={GRADIENT_CONFIGS.outcomePillBorder.end}
              borderRadius={14}
              style={styles.outcomePillContainer}
            >
              <LinearGradient
                colors={colors.outcomePillGradient}
                locations={GRADIENT_CONFIGS.outcomePill.locations}
                style={styles.outcomePillGradient}
                start={GRADIENT_CONFIGS.outcomePill.start}
                end={GRADIENT_CONFIGS.outcomePill.end}
                pointerEvents="none"
              />
              <View style={styles.row}>
                <Text color={colors.textColor} size="13pt" weight="heavy">
                  {markets[0].odds}
                </Text>
                <Text color="label" numberOfLines={1} size="13pt" weight="heavy" style={styles.flex}>
                  {markets[0].title}
                </Text>
              </View>
              {markets[1] ? (
                <View style={styles.separatorContainer}>
                  <Separator color={colors.textColor} thickness={THICK_BORDER_WIDTH} />
                </View>
              ) : null}
              {markets[1] ? (
                <View style={styles.row}>
                  <Text color={colors.textColor} size="13pt" weight="heavy">
                    {markets[1].odds}
                  </Text>
                  <Text color="labelSecondary" numberOfLines={1} size="13pt" weight="bold" style={styles.flex}>
                    {markets[1].title}
                  </Text>
                </View>
              ) : null}
            </GradientBorderView>
          </View>
        </GradientBorderView>
      </ButtonPressAnimation>

      {/* <BookmarkIcon event={event} /> */}
    </View>
  );
});

// const BookmarkIcon = ({ event }: { event: PolymarketEvent }) => {
//   const isBookmarked = usePolymarketRecommendationsStore(state => state.isBookmarked(event.id));
//   return (
//     <ButtonPressAnimation
//       onPress={() => polymarketRecommendationsActions.toggleBookmark(event)}
//       scaleTo={0.8}
//       style={styles.bookmarkButton}
//     >
//       <TextShadow blur={18} shadowOpacity={isBookmarked ? 0.32 : 0}>
//         <Text align="center" color={isBookmarked ? 'yellow' : 'labelQuinary'} size="icon 13px" weight="black">
//           􀋃
//         </Text>
//       </TextShadow>
//     </ButtonPressAnimation>
//   );
// };

export const LoadingSkeleton = memo(function LoadingSkeleton() {
  const { isDarkMode } = useColorMode();
  const fillQuaternary = useBackgroundColor('fillQuaternary');
  const fillSecondary = useBackgroundColor('fillSecondary');
  const shimmerColor = opacity(fillSecondary, 0.1);
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

function calculateOddsPrice(market: PolymarketMarket): number {
  let price = market.lastTradePrice;
  if (price === undefined) {
    if (market.bestAsk !== undefined && market.bestBid !== undefined) {
      price = (market.bestAsk + market.bestBid) / 2;
    } else {
      price = 0;
    }
  }
  return price;
}

const styles = StyleSheet.create({
  bookmarkButton: {
    alignItems: 'center',
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 58,
  },
  contentContainer: {
    flex: 1,
    height: HEIGHT,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  flex: {
    flex: 1,
  },
  headerContainer: {
    flex: 1,
    gap: 10,
  },
  icon: {
    borderRadius: 9,
    height: 32,
    marginBottom: 6,
    width: 32,
  },
  outcomePillContainer: {
    marginLeft: -8,
    marginRight: -16,
    overflow: 'hidden',
  },
  outcomePillGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
  },
  separatorContainer: {
    opacity: 0.03,
    paddingLeft: 10,
    paddingRight: 16,
  },
  skeleton: {
    borderRadius: 26,
    height: HEIGHT,
    overflow: 'hidden',
  },
  lightModeCardFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: opacity(globalColors.white100, 0.89),
  },
});
