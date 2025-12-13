import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import ImgixImage from '@/components/images/ImgixImage';
import { Text, TextIcon, useBackgroundColor } from '@/design-system';
import { PolymarketEvent, PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { Navigation } from '@/navigation';
import { memo, useMemo } from 'react';
import Routes from '@/navigation/routesNames';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import LinearGradient from 'react-native-linear-gradient';
import { formatNumber } from '@/helpers/strings';
import { roundWorklet, toPercentageWorklet } from '@/safe-math/SafeMath';
import { createOpacityPalette } from '@/worklets/colors';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { deepFreeze } from '@/utils/deepFreeze';

export const HEIGHT = 228;

const GRADIENT_CONFIGS = {
  card: {
    end: { x: 0, y: 1 },
    start: { x: 0, y: 0 },
  },
  outcomePill: {
    end: { x: 0.79, y: 0 },
    locations: [0.06, 1],
    start: { x: -0.06, y: 0 },
  },
  outcomePillBorder: {
    end: { x: 1, y: 0 },
    start: { x: -1, y: 0 },
  },
};
const OPACITIES = deepFreeze([0, 12, 24]);

export const PolymarketEventsListItem = memo(function PolymarketEventsListItem({
  event,
  style,
}: {
  event: PolymarketEvent;
  style?: StyleProp<ViewStyle>;
}) {
  const firstMarket = useMemo(() => {
    const market = event.markets.find(market => market.active && !market.closed);
    if (!market)
      // Placeholder for case that should not happen
      return {
        title: 'Yes',
        odds: '',
      };
    const title = market.groupItemTitle || market.outcomes[0];
    const odds = calculateOddsPrice(market);
    return {
      title,
      odds: `${roundWorklet(toPercentageWorklet(odds))}%`,
    };
  }, [event]);

  const colors = useMemo(() => {
    const palette = createOpacityPalette(event.color, OPACITIES);
    return {
      borderGradient: [palette.opacity12, palette.opacity0],
      cardGradient: [palette.opacity24, palette.opacity0],
      outcomePillGradient: [event.color, palette.opacity0],
      textColor: { custom: event.color },
    };
  }, [event.color]);

  const iconSource = useMemo(() => ({ uri: event.icon ?? event.image }), [event.icon, event.image]);

  return (
    <ButtonPressAnimation onPress={() => navigateToEvent(event)} scaleTo={0.92} style={style}>
      <GradientBorderView borderGradientColors={colors.borderGradient} borderRadius={26} borderWidth={2} style={styles.overflowHidden}>
        <LinearGradient
          colors={colors.cardGradient}
          style={StyleSheet.absoluteFill}
          start={GRADIENT_CONFIGS.card.start}
          end={GRADIENT_CONFIGS.card.end}
          pointerEvents="none"
        />

        <View style={styles.contentContainer}>
          <View style={styles.starContainer}>
            <TextIcon size="icon 13px" weight="black" color={'labelQuaternary'}>
              {'􀋃'}
            </TextIcon>
          </View>
          <View style={styles.headerContainer}>
            <ImgixImage enableFasterImage source={iconSource} size={32} style={styles.icon} />
            <Text size="20pt" weight="bold" color="label" numberOfLines={4} align="left">
              {event.title}
            </Text>
          </View>

          <GradientBorderView
            borderGradientColors={colors.borderGradient}
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
              <Text size="15pt" weight="bold" color={colors.textColor}>
                {firstMarket.odds}
              </Text>
              <Text size="15pt" weight="bold" color="labelSecondary" numberOfLines={1} style={styles.flex}>
                {firstMarket.title}
              </Text>
            </View>
          </GradientBorderView>
        </View>
      </GradientBorderView>
    </ButtonPressAnimation>
  );
});

export const LoadingSkeleton = memo(function LoadingSkeleton() {
  const skeletonColor = useBackgroundColor('fillQuaternary');
  const shimmerColor = opacityWorklet(useBackgroundColor('fillSecondary'), 0.1);

  return (
    <View style={[styles.skeleton, { backgroundColor: skeletonColor }]}>
      <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
    </View>
  );
});

function navigateToEvent(event: PolymarketEvent) {
  Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { eventId: event.id, event: event });
}

function calculateOddsPrice(market: PolymarketMarket) {
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
  contentContainer: {
    flex: 1,
    height: HEIGHT,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
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
    overflow: 'hidden',
    marginLeft: -8,
    marginRight: -8,
  },
  outcomePillGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 36,
    paddingHorizontal: 12,
  },
  starContainer: {
    opacity: 0.5,
    position: 'absolute',
    right: 20,
    top: 20,
  },
  skeleton: {
    height: HEIGHT,
    borderRadius: 26,
    overflow: 'hidden',
  },
});
