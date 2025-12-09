import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import ImgixImage from '@/components/images/ImgixImage';
import { Bleed, Text, TextIcon } from '@/design-system';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { Navigation } from '@/navigation';
import { memo, useMemo } from 'react';
import Routes from '@/navigation/routesNames';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import LinearGradient from 'react-native-linear-gradient';
import { formatNumber } from '@/helpers/strings';
import { roundWorklet, toPercentageWorklet } from '@/safe-math/SafeMath';

export const HEIGHT = 239;

export const PolymarketEventsListItem = memo(function PolymarketEventsListItem({ event }: { event: PolymarketEvent }) {
  const mostLikelyOutcome = useMemo(() => {
    const market = getMostLikelyMarket(event);
    if (!market)
      return {
        title: 'No market found',
        odds: '0%',
      };
    const title = market.groupItemTitle || market.outcomes[0];
    // TODO: Decide how to handle this case
    const odds = market.lastTradePrice !== undefined ? `${roundWorklet(toPercentageWorklet(market.lastTradePrice))}%` : 'N/A';
    return {
      title,
      odds,
    };
  }, [event]);

  const accentColors = useMemo(() => {
    return {
      opacity0: opacityWorklet(event.color, 0),
      opacity6: opacityWorklet(event.color, 0.06),
      opacity12: opacityWorklet(event.color, 0.12),
      opacity14: opacityWorklet(event.color, 0.14),
      opacity24: opacityWorklet(event.color, 0.24),
      opacity100: event.color,
    };
  }, [event.color]);

  return (
    <ButtonPressAnimation scaleTo={0.97} onPress={() => navigateToEvent(event)}>
      <GradientBorderView
        borderGradientColors={[accentColors.opacity14, accentColors.opacity0]}
        locations={[0, 0.94]}
        borderRadius={26}
        borderWidth={2}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.75, y: 0.6 }}
      >
        <LinearGradient
          colors={[accentColors.opacity14, accentColors.opacity0]}
          locations={[0, 0.94]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.6, y: 0.62 }}
        />

        <View style={styles.contentContainer}>
          <View style={{ position: 'absolute', top: 20, right: 20, opacity: 0.5 }}>
            <TextIcon size="icon 13px" weight="heavy" color={'labelQuaternary'}>
              {'􀋃'}
            </TextIcon>
          </View>
          <View style={{ gap: 10, flex: 1 }}>
            <View style={{ gap: 16 }}>
              <ImgixImage source={{ uri: event.icon ?? event.image }} size={32} style={styles.icon} />
              <Text size="13pt" weight="bold" color="labelQuaternary">
                {formatNumber(event.volume, { useOrderSuffix: true, decimals: 1, style: '$' })}
              </Text>
            </View>
            <Text size="17pt" weight="bold" color="label" numberOfLines={4} style={{}} align="left">
              {event.title}
            </Text>
          </View>

          <Bleed horizontal={'8px'}>
            <GradientBorderView
              borderGradientColors={[accentColors.opacity6, accentColors.opacity0]}
              start={{ x: -1, y: 0 }}
              end={{ x: 1, y: 0 }}
              borderRadius={16}
              borderWidth={2}
            >
              <LinearGradient
                colors={[accentColors.opacity100, accentColors.opacity0]}
                locations={[0.06, 1]}
                style={[StyleSheet.absoluteFill, { opacity: 0.14 }]}
                start={{ x: -0.06, y: 0 }}
                end={{ x: 0.79, y: 0 }}
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
          </Bleed>
        </View>
      </GradientBorderView>
    </ButtonPressAnimation>
  );
});

function getMostLikelyMarket(event: PolymarketEvent) {
  // Markets are already sorted by lastTradePrice
  return event.markets.find(market => market.active && !market.closed);
  // return event.markets.sort((a, b) => b.volume24hr - a.volume24hr).find(market => market.active && !market.closed);
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
