import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ImgixImage from '@/components/images/ImgixImage';
import { Text, TextIcon, useColorMode } from '@/design-system';
import { Border } from '@/design-system/components/Border/Border';
import { COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW } from '@/features/charts/line/compact/CompactLineChartRenderer';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { convertStoredPerpPriceChangeToPercent, formatCompactPerpPercentChange } from '@/features/discover/components/perpMarketFormatting';
import { DOWN_ARROW, HYPERLIQUID_COLORS, UP_ARROW } from '@/features/perps/constants';
import { useHyperliquidLineChartsStore } from '@/features/perps/stores/hyperliquidLineChartsStore';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { navigateToPerpDetailScreen } from '@/features/perps/utils';
import { type PlacementItemAnalyticsMetadata } from '@/features/placements/types';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { measureTextSync, type MeasureTextProps } from '@/utils/measureText';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

// ============ Types ========================================================== //

export type PerpMarketCardProps = {
  market: PerpMarketWithMetadata;
  onPressTracked?: (metadata?: PlacementItemAnalyticsMetadata) => void;
  style?: StyleProp<ViewStyle>;
};

type PriceChangeDirection = 'negative' | 'positive';
type CardColorMode = 'dark' | 'light';

type CardColors = {
  backgroundColor: string;
  badgeBorderColor: string;
  badgeShadowOpacity: number;
  borderColor: string;
  gradientOpacity: number;
};

// ============ Layout ========================================================= //

export const PERP_MARKET_CARD_HEIGHT = 76;
export const PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART = 210;

const ICON_SIZE = 50;
const LEVERAGE_BADGE_BORDER_RADIUS = 8;
const UP_DOWN_ARROW_WIDTH = 12;
const PRICE_CHANGE_ROW_GAP = 3;

const CHART_LAYOUT = { height: 34, width: 44 };
const CARD_LAYOUT = { borderRadius: 24, borderWidth: THICK_BORDER_WIDTH, gap: 10, maxWidth: 280, paddingLeft: 12, paddingRight: 16 };
const PRICE_CHANGE_TEXT_STYLE = { size: '15pt', weight: 'bold' } satisfies MeasureTextProps;
const SYMBOL_TEXT_STYLE = { size: '17pt', weight: 'bold' } satisfies MeasureTextProps;

const CARD_WIDTH_BASE =
  CARD_LAYOUT.paddingLeft +
  CARD_LAYOUT.paddingRight +
  ICON_SIZE +
  CARD_LAYOUT.gap * 2 +
  CHART_LAYOUT.width +
  COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW * 2;

const PERP_MARKET_CARD_TEXT_MIN_WIDTH = PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART - CARD_WIDTH_BASE;

/**
 * Returns the carousel slot width for rendered perp card text.
 */
export function computePerpCardWidth(market: PerpMarketWithMetadata): number {
  const percentChange = convertStoredPerpPriceChangeToPercent(market.priceChange['24h']);
  const priceChangeWidth =
    UP_DOWN_ARROW_WIDTH + PRICE_CHANGE_ROW_GAP + measureTextSync(formatCompactPerpPercentChange(percentChange), PRICE_CHANGE_TEXT_STYLE);

  const textWidth = Math.max(PERP_MARKET_CARD_TEXT_MIN_WIDTH, measureTextSync(market.baseSymbol, SYMBOL_TEXT_STYLE), priceChangeWidth);

  return Math.min(CARD_LAYOUT.maxWidth, Math.ceil(CARD_WIDTH_BASE + textWidth));
}

// ============ Colors ========================================================= //

const PRICE_CHANGE_COLORS: Record<PriceChangeDirection, Record<CardColorMode, string>> = {
  positive: { light: '#1DB847', dark: '#3ECF5B' },
  negative: { light: '#FA423C', dark: '#FF584D' },
};

const CARD_COLORS = {
  dark: {
    backgroundColor: '#171B20',
    badgeBorderColor: 'rgba(255,255,255,0.16)',
    badgeShadowOpacity: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    gradientOpacity: 0.26,
  },
  light: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    badgeBorderColor: 'rgba(0,0,0,0.07)',
    badgeShadowOpacity: 0.25,
    borderColor: 'rgba(255,255,255,0.8)',
    gradientOpacity: 0.06,
  },
} satisfies Record<CardColorMode, CardColors>;

// ============ Component ====================================================== //

export const PerpMarketCard = memo(function PerpMarketCard({ market, onPressTracked, style }: PerpMarketCardProps) {
  const { isDarkMode } = useColorMode();
  const symbol = market.symbol;

  const onPress = useCallback(() => {
    navigateToPerpDetailScreen(market.symbol);
    onPressTracked?.({
      marketId: market.symbol,
      marketName: market.metadata?.name ?? market.baseSymbol,
      marketSymbol: market.baseSymbol,
    });
  }, [market, onPressTracked]);

  const { accentColor, badgeTextColor, cardColors, iconUrl, priceChange } = useMemo(
    () => buildPerpMarketCardDisplay(isDarkMode, market),
    [isDarkMode, market]
  );

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={[styles.pressable, style]}>
      <View style={[styles.cardShadow, isDarkMode ? styles.cardShadowDark : styles.cardShadowLight]}>
        <View style={[styles.card, { backgroundColor: cardColors.backgroundColor }]}>
          <LinearGradient
            colors={[opacity(accentColor, cardColors.gradientOpacity), opacity(accentColor, 0)]}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={styles.cardGradient}
          />

          <View style={styles.contentRow}>
            <View style={styles.leftContent}>
              <View style={[styles.iconContainer, { borderColor: accentColor, shadowColor: accentColor }]}>
                <View style={styles.iconFill}>
                  {iconUrl ? (
                    <ImgixImage enableFasterImage size={styles.iconImage.height} source={{ uri: iconUrl }} style={styles.iconImage} />
                  ) : (
                    <Text align="center" size="15pt" weight="heavy" color={{ custom: accentColor }}>
                      {market.baseSymbol.slice(0, 1)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.textColumn}>
                <Text
                  size={SYMBOL_TEXT_STYLE.size}
                  weight={SYMBOL_TEXT_STYLE.weight}
                  color="label"
                  numberOfLines={1}
                  style={styles.symbolText}
                >
                  {market.baseSymbol}
                </Text>

                <View style={styles.changeRow}>
                  <TextIcon
                    color={{ custom: priceChange.color }}
                    containerSize={UP_DOWN_ARROW_WIDTH}
                    height={8}
                    size="icon 12px"
                    weight="heavy"
                    width={UP_DOWN_ARROW_WIDTH}
                  >
                    {priceChange.arrow}
                  </TextIcon>
                  <Text
                    size={PRICE_CHANGE_TEXT_STYLE.size}
                    weight={PRICE_CHANGE_TEXT_STYLE.weight}
                    color={{ custom: priceChange.color }}
                    numberOfLines={1}
                    style={styles.percentText}
                  >
                    {formatCompactPerpPercentChange(priceChange.percent)}
                  </Text>
                </View>
              </View>
            </View>

            <SparklineChart
              chartId={symbol}
              color={priceChange.color}
              height={CHART_LAYOUT.height}
              store={useHyperliquidLineChartsStore}
              width={CHART_LAYOUT.width}
            />
          </View>

          <View
            style={[
              styles.badge,
              {
                backgroundColor: accentColor,
                shadowColor: isDarkMode ? '#000000' : accentColor,
                shadowOpacity: cardColors.badgeShadowOpacity,
              },
            ]}
          >
            <Text align="center" size="11pt" weight="heavy" color={{ custom: badgeTextColor }}>
              {`${market.maxLeverage}x`}
            </Text>
            <Border
              borderColor={{ custom: cardColors.badgeBorderColor }}
              borderRadius={LEVERAGE_BADGE_BORDER_RADIUS}
              borderWidth={THICK_BORDER_WIDTH}
            />
          </View>

          <Border
            borderColor={{ custom: cardColors.borderColor }}
            borderRadius={CARD_LAYOUT.borderRadius}
            borderWidth={CARD_LAYOUT.borderWidth}
            enableInLightMode
          />
        </View>
      </View>
    </ButtonPressAnimation>
  );
});

// ============ Display Helpers =============================================== //

function buildPerpMarketCardDisplay(isDarkMode: boolean, market: PerpMarketWithMetadata) {
  const accentColor = market.metadata?.colors?.color || market.metadata?.colors?.fallbackColor || HYPERLIQUID_COLORS.green;
  const badgeTextColor = getHighContrastTextColorWorklet(accentColor, 4);
  const colorMode: CardColorMode = isDarkMode ? 'dark' : 'light';
  const percent = convertStoredPerpPriceChangeToPercent(market.priceChange['24h']);
  const direction: PriceChangeDirection = percent >= 0 ? 'positive' : 'negative';

  return {
    accentColor,
    badgeTextColor,
    cardColors: CARD_COLORS[colorMode],
    iconUrl: market.metadata?.iconUrl,
    priceChange: {
      arrow: direction === 'positive' ? UP_ARROW : DOWN_ARROW,
      color: PRICE_CHANGE_COLORS[direction][colorMode],
      percent,
    },
  };
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: LEVERAGE_BADGE_BORDER_RADIUS,
    justifyContent: 'center',
    left: 9,
    paddingHorizontal: 5,
    paddingVertical: 5,
    position: 'absolute',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4.5,
    top: 9,
  },
  card: {
    borderCurve: 'continuous',
    borderRadius: CARD_LAYOUT.borderRadius,
    height: PERP_MARKET_CARD_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: CARD_LAYOUT.paddingLeft,
    paddingRight: CARD_LAYOUT.paddingRight,
    paddingVertical: 12,
    width: '100%',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderCurve: 'continuous',
    borderRadius: CARD_LAYOUT.borderRadius,
    overflow: 'hidden',
  },
  cardShadow: {
    borderCurve: 'continuous',
    borderRadius: CARD_LAYOUT.borderRadius,
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
    gap: PRICE_CHANGE_ROW_GAP,
  },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: CARD_LAYOUT.gap,
    justifyContent: 'space-between',
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 8 / 3,
    height: ICON_SIZE,
    justifyContent: 'center',
    padding: 2,
    width: ICON_SIZE,
  },
  iconFill: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  iconImage: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  leftContent: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: CARD_LAYOUT.gap,
    minWidth: 0,
  },
  percentText: {
    flexShrink: 1,
  },
  pressable: {
    width: '100%',
  },
  symbolText: {
    flexShrink: 1,
  },
  textColumn: {
    flexShrink: 1,
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
