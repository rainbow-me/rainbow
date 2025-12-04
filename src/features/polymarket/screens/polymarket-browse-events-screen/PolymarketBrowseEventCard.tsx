import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import ImgixImage from '@/components/images/ImgixImage';
import { Text } from '@/design-system';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { Navigation } from '@/navigation';
import { memo, useMemo } from 'react';
import Routes from '@/navigation/routesNames';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import LinearGradient from 'react-native-linear-gradient';
import { formatNumber } from '@/helpers/strings';
import { toPercentageWorklet } from '@/safe-math/SafeMath';

const HEIGHT = 239;

export const PolymarketEventCard = memo(function PolymarketEventCard({ event }: { event: PolymarketEvent }) {
  const mostLikelyOutcome = useMemo(() => {
    const market = getMostLikelyMarket(event);
    if (!market)
      return {
        title: 'No market found',
        odds: '0%',
      };
    const title = market.groupItemTitle || market.outcomes[0];
    const odds = `${toPercentageWorklet(market.lastTradePrice)}%`;
    return {
      title,
      odds,
    };
  }, [event]);

  const accentColors = useMemo(() => {
    return {
      opacity0: opacityWorklet(event.color, 0),
      opacity12: opacityWorklet(event.color, 0.12),
      opacity24: opacityWorklet(event.color, 0.24),
      opacity100: event.color,
    };
  }, [event.color]);

  return (
    <ButtonPressAnimation onPress={() => navigateToEvent(event)}>
      <GradientBorderView
        borderGradientColors={[accentColors.opacity24, accentColors.opacity0]}
        borderRadius={26}
        style={{ overflow: 'hidden' }}
      >
        <LinearGradient
          colors={[accentColors.opacity24, accentColors.opacity0]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />

        <View style={styles.contentContainer}>
          <View style={{ gap: 10, flex: 1 }}>
            <View style={{ gap: 16 }}>
              <ImgixImage source={{ uri: event.icon }} size={32} style={styles.icon} />
              <Text size="13pt" weight="bold" color="labelQuaternary">
                {formatNumber(event.volume, { useOrderSuffix: true, decimals: 1, style: '$' })}
              </Text>
            </View>
            <Text size="17pt" weight="bold" color="label" numberOfLines={4} style={{}} align="left">
              {event.title}
            </Text>
          </View>

          <GradientBorderView
            borderGradientColors={[accentColors.opacity24, accentColors.opacity0]}
            borderRadius={26}
            style={{ overflow: 'hidden' }}
          >
            <LinearGradient
              colors={[accentColors.opacity24, accentColors.opacity0]}
              style={[StyleSheet.absoluteFill, { opacity: 0.14 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
            />
            <View style={[styles.row, { height: 36, paddingHorizontal: 12 }]}>
              <Text size="15pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
                {mostLikelyOutcome.odds}
              </Text>
              <Text size="15pt" weight="bold" color="labelSecondary" numberOfLines={1} style={{ flex: 1 }}>
                {mostLikelyOutcome.title}
              </Text>
            </View>
          </GradientBorderView>
        </View>
      </GradientBorderView>
    </ButtonPressAnimation>
  );
});

function getMostLikelyMarket(event: PolymarketEvent) {
  // Markets are already sorted by lastTradePrice
  return event.markets.find(market => market.active && !market.closed);
}

function navigateToEvent(event: PolymarketEvent) {
  Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { eventId: event.id, event: event });
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    height: HEIGHT,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
