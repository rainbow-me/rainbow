import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import ConditionalWrap from 'conditional-wrap';
import { LinearGradient } from 'expo-linear-gradient';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { CARD_HEIGHT } from '@/components/Discover/MarketCarousel';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import ImgixImage from '@/components/images/ImgixImage';
import { Box, Text, TextShadow, useBackgroundColor, useColorMode } from '@/design-system';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { type PlacementItem } from '@/features/placements/types';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { type PolymarketEvent, type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';
import { opacity } from '@/framework/ui/utils/opacity';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { createOpacityPalette } from '@/worklets/colors';

type PredictionMarketCardProps = {
  item: PlacementItem;
};

export const PredictionMarketCard = memo(function PredictionMarketCard({ item }: PredictionMarketCardProps) {
  const { isDarkMode } = useColorMode();
  const event = usePolymarketEventStore(state => state.getData({ eventId: item.ref.id })) as PolymarketEvent | null;

  if (!event) return <PredictionCardSkeleton />;
  if (event.closed === true || event.active === false) return null;

  return <PredictionMarketCardContent item={item} event={event} isDarkMode={isDarkMode} />;
});

const PredictionMarketCardContent = memo(function PredictionMarketCardContent({
  event,
  isDarkMode,
}: {
  item: PlacementItem;
  event: PolymarketEvent;
  isDarkMode: boolean;
}) {
  const rawEventColor = getColorValueForThemeWorklet(event.color, isDarkMode);
  const eventColor = useMemo(() => getHighContrastColor(rawEventColor, isDarkMode), [rawEventColor, isDarkMode]);
  const accentColors = useMemo(() => createOpacityPalette(eventColor, [0, 8, 16, 24, 60] as const), [eventColor]);
  const iconSource = useMemo(() => ({ uri: event.icon ?? event.image }), [event.icon, event.image]);

  const { oddsText, volumeText } = useMemo(() => {
    const activeMarkets = event.markets.filter(m => m.active && !m.closed);
    const firstMarket = activeMarkets[0];
    const odds = firstMarket ? `${roundWorklet(toPercentageWorklet(calculateOddsPrice(firstMarket)))}%` : '';
    const outcomeLabel = firstMarket?.outcomes?.[0] ?? i18n.t(i18n.l.predictions.outcomes.yes);
    const vol = formatCurrency(String(event.volume ?? 0), { useCompactNotation: true, decimals: 1 });

    return {
      oddsText: odds ? `${odds} ${outcomeLabel}` : '',
      volumeText: `${i18n.t(i18n.l.market_data.vol)} ${vol}`,
    };
  }, [event]);

  const onPress = useCallback(() => Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { eventId: event.id, event }), [event]);

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <ConditionalWrap
        condition={isDarkMode}
        wrap={children => (
          <GradientBorderView
            borderGradientColors={[accentColors.opacity8, accentColors.opacity16]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            borderRadius={32}
            borderWidth={2.5}
            style={styles.clip}
          >
            {children}
          </GradientBorderView>
        )}
      >
        <ConditionalWrap
          condition={!isDarkMode}
          wrap={children => (
            <Box background="surfacePrimaryElevated" shadow="24px" borderRadius={32} style={styles.shadowHost}>
              <View style={styles.clip}>{children}</View>
            </Box>
          )}
        >
          <View style={styles.cardInner}>
            {isDarkMode && (
              <LinearGradient
                colors={[accentColors.opacity24, accentColors.opacity0]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            )}

            <View style={[styles.iconBorder, { borderColor: isDarkMode ? opacity(eventColor, 0.2) : accentColors.opacity60 }]}>
              <ImgixImage enableFasterImage source={iconSource} size={52} style={styles.icon} />
            </View>

            <View style={styles.content}>
              <Text size="17pt" weight="bold" color="label" numberOfLines={2}>
                {event.title}
              </Text>

              <View style={styles.bottomRow}>
                {oddsText ? (
                  <TextShadow blur={10} color={eventColor} shadowOpacity={isDarkMode ? 0.4 : 0}>
                    <Text size="15pt" weight="bold" color={{ custom: eventColor }} numberOfLines={1}>
                      {oddsText}
                    </Text>
                  </TextShadow>
                ) : null}
                {oddsText && volumeText ? (
                  <View style={[styles.separator, { backgroundColor: opacity(isDarkMode ? '#FFF' : '#000', 0.1) }]} />
                ) : null}
                <Text size="15pt" weight="bold" color="labelQuaternary" numberOfLines={1}>
                  {volumeText}
                </Text>
              </View>
            </View>
          </View>
        </ConditionalWrap>
      </ConditionalWrap>
    </ButtonPressAnimation>
  );
});

function PredictionCardSkeleton() {
  const { isDarkMode } = useColorMode();
  const fillQuaternary = useBackgroundColor('fillQuaternary');
  const fillSecondary = useBackgroundColor('fillSecondary');
  const shimmerColor = opacity(fillSecondary, 0.1);
  const skeletonColor = isDarkMode ? fillQuaternary : fillSecondary;

  return (
    <View style={[styles.clip, { backgroundColor: skeletonColor }]}>
      <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
    </View>
  );
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
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cardInner: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 17,
    paddingVertical: 17,
  },
  clip: {
    borderRadius: 32,
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  icon: {
    borderRadius: 12,
    height: 52,
    width: 52,
  },
  iconBorder: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2.66,
    height: 60,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 60,
  },
  separator: {
    borderRadius: 1,
    height: 12,
    width: 2,
  },
  shadowHost: {
    borderRadius: 32,
    height: CARD_HEIGHT,
  },
});
