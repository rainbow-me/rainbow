import React, { memo, useCallback } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { textSizes, textWeights } from '@/design-system/typography/typography';
import { useCandlestickStore } from '@/features/charts/stores/candlestickStore';
import { CandleResolution } from '@/features/charts/types';
import { PerpMarketSparkline } from '@/features/discover/components/PerpMarketSparkline';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { DOWN_ARROW, HYPERLIQUID_COLORS, UP_ARROW } from '@/features/perps/constants';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { convertStoredPerpPriceChangeToPercent, formatCompactPerpPercentChange, navigateToPerpDetailScreen } from '@/features/perps/utils';
import { useDiscoverPerpsStore } from '@/features/placements/stores/discover/discoverPerpsStore';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { measureTextSync } from '@/utils/measureText';

type PerpMarketCardProps = {
  item: PlacementItem;
  placement: Placement;
  style?: StyleProp<ViewStyle>;
};

export type { PerpMarketCardProps };

const SPARKLINE_WIDTH = 46;
const SPARKLINE_HEIGHT = 52;

const PERP_MARKET_CARD_WIDTH_WITH_CHART = 210;
export const PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART = PERP_MARKET_CARD_WIDTH_WITH_CHART;
export const PERP_MARKET_CARD_HEIGHT = 76;

const PERP_MARKET_CARD_MAX_WIDTH = 280;
const PERP_MARKET_CHART_FIXED_WIDTH = 150;
const PERCENT_ARROW_BLOCK_WIDTH = 14; // arrow icon width + arrow→text gap

const SYMBOL_TEXT_STYLE = {
  fontFamily: textWeights.bold.fontFamily,
  fontSize: textSizes['17pt'].fontSize,
  fontWeight: textWeights.bold.fontWeight,
  letterSpacing: textSizes['17pt'].letterSpacing,
} as const;

const PERCENT_TEXT_STYLE = {
  fontFamily: textWeights.bold.fontFamily,
  fontSize: textSizes['15pt'].fontSize,
  fontWeight: textWeights.bold.fontWeight,
  letterSpacing: textSizes['15pt'].letterSpacing,
} as const;

const PERCENT_MAX_WIDTH = Math.ceil(measureTextSync('99.9%', PERCENT_TEXT_STYLE)) + PERCENT_ARROW_BLOCK_WIDTH;
const PERP_MARKET_CHART_TEXT_MIN_WIDTH = PERCENT_MAX_WIDTH;

export function computePerpCardWidth({ symbol }: { symbol?: string }): number {
  const symbolWidth = symbol ? Math.ceil(measureTextSync(symbol, SYMBOL_TEXT_STYLE)) : 0;
  const textWidth = Math.max(PERP_MARKET_CHART_TEXT_MIN_WIDTH, symbolWidth);

  return Math.min(PERP_MARKET_CARD_MAX_WIDTH, PERP_MARKET_CHART_FIXED_WIDTH + textWidth);
}

const CARD_BACKGROUND_COLOR = { light: 'rgba(255,255,255,0.92)', dark: '#171B20' } as const;
const CARD_BORDER_COLOR = { light: 'rgba(255,255,255,0.8)', dark: 'rgba(255,255,255,0.08)' } as const;
const BADGE_BORDER_COLOR = { light: 'rgba(0,0,0,0.07)', dark: 'rgba(255,255,255,0.24)' } as const;
const BADGE_TEXT_COLOR = { light: '#FFFFFF', dark: 'rgba(0,0,0,0.8)' } as const;

export const PerpMarketCard = memo(function PerpMarketCard({ item, placement, style }: PerpMarketCardProps) {
  const market = useHyperliquidMarketsStore(state => state.getMarket(item.ref.id));
  const chart = useDiscoverPerpsStore(state => state.getChart(item.ref.id));
  const candlestickPercentChange = useCandlestickStore(state => {
    const price = state.prices[item.ref.id];
    return price?.candleResolution === CandleResolution.H1 ? price.percentChange : undefined;
  });
  const { colorMode, isDarkMode } = useColorMode();
  const positiveChangeColor = useForegroundColor('green');
  const negativeChangeColor = useForegroundColor('red');

  const onPress = useCallback(() => {
    if (!market) return;
    const percentChange =
      candlestickPercentChange ??
      chart?.percentChange ??
      convertStoredPerpPriceChangeToPercent(market.priceChange['1h'] ?? market.priceChange['24h']);
    const perpsPayload = {
      provider: 'hyperliquid' as const,
      market: market.symbol,
      baseSymbol: market.baseSymbol,
      price: market.price,
      priceChange1h: market.priceChange['1h'],
      priceChange24h: market.priceChange['24h'],
      volume24h: market.volume['24h'],
      maxLeverage: market.maxLeverage,
      name: market.metadata?.name,
      percentChange,
    };
    analytics.track(event.placementInteraction, {
      id: placement.id,
      screen: placement.screen,
      order: placement.order,
      version: placement.version,
      updatedAt: placement.updatedAt,
      itemRefSource: item.ref.source,
      itemRefId: item.ref.id,
      itemOrder: item.order,
      type: 'perps',
      ...perpsPayload,
    });
    analytics.track(event.discoverFeaturedCarouselCardPressed, {
      placementId: placement.id,
      type: 'perps',
      order: item.order,
      ...perpsPayload,
    });
    navigateToPerpDetailScreen(market.symbol);
  }, [candlestickPercentChange, chart, item, market, placement]);

  if (!market) return null;

  const accentColor = market.metadata?.colors?.color || market.metadata?.colors?.fallbackColor || HYPERLIQUID_COLORS.green;
  const percentChange =
    candlestickPercentChange ??
    chart?.percentChange ??
    convertStoredPerpPriceChangeToPercent(market.priceChange['1h'] ?? market.priceChange['24h']);
  const isPositive = percentChange >= 0;
  const changeColor = isPositive ? positiveChangeColor : negativeChangeColor;
  const cardBackgroundColor = getValueForColorMode(CARD_BACKGROUND_COLOR, colorMode);
  const borderColor = getValueForColorMode(CARD_BORDER_COLOR, colorMode);
  const badgeBorderColor = getValueForColorMode(BADGE_BORDER_COLOR, colorMode);
  const badgeTextColor = getValueForColorMode(BADGE_TEXT_COLOR, colorMode);
  const gradientStartColor = opacity(accentColor, isDarkMode ? 0.26 : 0.06);
  const cardWidth = computePerpCardWidth({ symbol: market.baseSymbol });
  const arrow = isPositive ? UP_ARROW : DOWN_ARROW;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} shouldActivateOnStart={false} style={[{ width: cardWidth }, style]}>
      <View style={[styles.cardShadow, isDarkMode ? styles.cardShadowDark : styles.cardShadowLight]}>
        <Box
          backgroundColor={cardBackgroundColor}
          borderColor={{ custom: borderColor }}
          borderRadius={24}
          borderWidth={THICK_BORDER_WIDTH}
          height={PERP_MARKET_CARD_HEIGHT}
          justifyContent="center"
          paddingLeft="12px"
          paddingRight="16px"
          paddingVertical="12px"
          style={styles.cardOverflow}
          width="full"
        >
          <LinearGradient
            colors={[gradientStartColor, opacity(accentColor, 0)]}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.contentRow}>
            <View style={styles.leftContent}>
              <Box
                alignItems="center"
                borderColor={{ custom: accentColor }}
                borderRadius={25}
                borderWidth={THICK_BORDER_WIDTH * 2}
                height={50}
                justifyContent="center"
                padding="2px"
                style={[styles.iconBorderShadow, { shadowColor: accentColor }]}
                width={50}
              >
                <HyperliquidTokenIcon size={42} symbol={market.symbol} />
              </Box>

              <View style={styles.textColumn}>
                <Text size="17pt" weight="bold" color="label" numberOfLines={1} style={styles.symbolText}>
                  {market.baseSymbol}
                </Text>

                <View style={styles.changeRow}>
                  <TextIcon color={{ custom: changeColor }} containerSize={12} height={20} size="icon 13px" weight="heavy" width={12}>
                    {arrow}
                  </TextIcon>
                  <Text size="15pt" weight="bold" color={{ custom: changeColor }} numberOfLines={1} style={styles.percentText}>
                    {formatCompactPerpPercentChange(percentChange)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.chartFrame}>
              {chart ? (
                <PerpMarketSparkline
                  chartColor={changeColor}
                  data={chart}
                  height={SPARKLINE_HEIGHT}
                  percentChange={percentChange}
                  width={SPARKLINE_WIDTH}
                />
              ) : null}
            </View>
          </View>
        </Box>

        <View style={styles.badgePositioner}>
          <Box
            alignItems="center"
            borderColor={{ custom: badgeBorderColor }}
            borderRadius={8}
            borderWidth={THICK_BORDER_WIDTH}
            justifyContent="center"
            style={[
              styles.badge,
              {
                backgroundColor: accentColor,
                shadowColor: isDarkMode ? '#000000' : accentColor,
                shadowOpacity: isDarkMode ? 0.14 : 0.25,
              },
            ]}
          >
            <Text align="center" size="11pt" weight="heavy" color={{ custom: badgeTextColor }}>
              {`${market.maxLeverage}x`}
            </Text>
          </Box>
        </View>
      </View>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  badge: {
    minHeight: 22,
    padding: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  badgePositioner: {
    left: 8.67,
    position: 'absolute',
    top: 8,
  },
  cardOverflow: {
    overflow: 'hidden',
  },
  cardShadow: {
    borderRadius: 24,
    height: PERP_MARKET_CARD_HEIGHT,
    width: '100%',
  },
  cardShadowDark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  cardShadowLight: {
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
  },
  changeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    minHeight: 20,
  },
  chartFrame: {
    alignItems: 'center',
    height: SPARKLINE_HEIGHT,
    justifyContent: 'center',
    width: SPARKLINE_WIDTH,
  },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  iconBorderShadow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  leftContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  percentText: {
    flexShrink: 1,
  },
  symbolText: {
    flexShrink: 1,
  },
  textColumn: {
    flexShrink: 1,
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 1,
  },
});
