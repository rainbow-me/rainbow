import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ImgixImage from '@/components/images/ImgixImage';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { AnimatedText, Text, useColorMode } from '@/design-system';
import { getValueForColorMode, type ColorMode, type ContextualColorValue } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { COMPACT_LINE_CHART_HORIZONTAL_OVERDRAW } from '@/features/charts/line/compact/CompactLineChartRenderer';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { CarouselCardSkeleton } from '@/features/discover/components/carousel/CarouselCardSkeleton';
import { usePlacementCardTrackPress } from '@/features/discover/components/carousel/placementCardContext';
import { buildPerpMarketBaseDisplay, type PriceChangeColors } from '@/features/discover/components/perpMarketCards/perpMarketCardChrome';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { useHyperliquidLineChartsStore } from '@/features/perps/stores/hyperliquidLineChartsStore';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import {
  convertStoredPerpPriceChangeToPercent,
  formatCompactPerpPercentChange,
  getHyperliquidTokenId,
  navigateToPerpDetailScreen,
} from '@/features/perps/utils';
import { opacity } from '@/framework/ui/utils/opacity';
import { type TokenData } from '@/state/liveTokens/liveTokensStore';
import { THICK_BORDER_WIDTH, THICKER_BORDER_WIDTH } from '@/styles/constants';
import { measureTextSync, type MeasureTextProps } from '@/utils/measureText';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

// ============ Types ========================================================== //

export type PerpMarketCardProps = {
  market: PerpMarketWithMetadata;
  style?: StyleProp<ViewStyle>;
};

type CardColors = {
  backgroundColor: string;
  badgeBorderColor: string;
  badgeShadowOpacity: number;
  borderColor: string;
  gradientOpacity: number;
};

type PerpMarketPriceChangeProps = {
  initialPriceChange: string;
  priceChangeColors: PriceChangeColors;
  symbol: string;
};

// ============ Layout ========================================================= //

export const PERP_MARKET_CARD_HEIGHT = 76;
export const PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART = 210;

const ICON_SIZE = 50;
const LEVERAGE_BADGE_BORDER_RADIUS = 8;
const UP_DOWN_ARROW_WIDTH = 12;
const PRICE_CHANGE_ROW_GAP = 3;

const CHART_LAYOUT = { height: 34, width: 44 };
const CARD_LAYOUT = { borderRadius: 24, borderWidth: THICKER_BORDER_WIDTH, gap: 10, maxWidth: 280, paddingLeft: 12, paddingRight: 16 };
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

// ============ Colors ========================================================= //

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
} satisfies ContextualColorValue<CardColors>;

// ============ Component ====================================================== //

export const PerpMarketCard = memo(function PerpMarketCard({ market, style }: PerpMarketCardProps) {
  const { colorMode, isDarkMode } = useColorMode();
  const symbol = market.symbol;
  const trackPress = usePlacementCardTrackPress();

  const onPress = useCallback(() => {
    navigateToPerpDetailScreen(symbol);
    trackPress?.({
      marketId: symbol,
      marketName: market.metadata?.name ?? market.baseSymbol,
      marketSymbol: market.baseSymbol,
    });
  }, [market.baseSymbol, market.metadata?.name, trackPress, symbol]);

  const { accentColor, badgeTextColor, cardColors, chartColor, iconUrl, priceChangeColors } = useMemo(
    () => buildPerpMarketCardDisplay(market, colorMode),
    [colorMode, market]
  );

  const initialPriceChange = market.priceChange['24h'];

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
                  <PerpMarketPriceChange initialPriceChange={initialPriceChange} priceChangeColors={priceChangeColors} symbol={symbol} />
                </View>
              </View>
            </View>

            <SparklineChart
              chartId={symbol}
              color={chartColor}
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

function selectPriceChangeText(priceChange: SharedValue<string>): string {
  'worklet';
  return formatCompactPerpPercentChange(convertStoredPerpPriceChangeToPercent(priceChange.value));
}

function selectPriceChangeArrow(priceChange: SharedValue<string>): string {
  'worklet';
  return Number(priceChange.value) >= 0 ? UP_ARROW : DOWN_ARROW;
}

const PerpMarketPriceChange = memo(function PerpMarketPriceChange({
  initialPriceChange,
  priceChangeColors,
  symbol,
}: PerpMarketPriceChangeProps) {
  const livePriceChange = useLiveTokenSharedValue({
    initialValue: initialPriceChange,
    selector: selectLivePriceChange24h,
    tokenId: getHyperliquidTokenId(symbol),
  });

  const priceChangeStyle = useAnimatedStyle(() => ({
    color: Number(livePriceChange.value) >= 0 ? priceChangeColors.positive : priceChangeColors.negative,
  }));

  return (
    <>
      <AnimatedTextIcon
        containerSize={UP_DOWN_ARROW_WIDTH}
        height={8}
        selector={selectPriceChangeArrow}
        size="icon 12px"
        textStyle={priceChangeStyle}
        weight="heavy"
        width={UP_DOWN_ARROW_WIDTH}
      >
        {livePriceChange}
      </AnimatedTextIcon>

      <AnimatedText
        size={PRICE_CHANGE_TEXT_STYLE.size}
        weight={PRICE_CHANGE_TEXT_STYLE.weight}
        numberOfLines={1}
        selector={selectPriceChangeText}
        style={priceChangeStyle}
      >
        {livePriceChange}
      </AnimatedText>
    </>
  );
});

// ============ Skeleton ======================================================= //

export function PerpMarketCardSkeleton() {
  return (
    <CarouselCardSkeleton
      borderRadius={CARD_LAYOUT.borderRadius}
      height={PERP_MARKET_CARD_HEIGHT}
      width={PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART}
    />
  );
}

// ============ Display Helpers =============================================== //

/**
 * Returns the carousel slot width for rendered perp card text.
 */
export function computePerpCardWidth(market: PerpMarketWithMetadata): number {
  const percentChange = convertStoredPerpPriceChangeToPercent(market.priceChange['24h']);
  const priceChangeWidth = UP_DOWN_ARROW_WIDTH + PRICE_CHANGE_ROW_GAP + getStablePercentChangeWidth(percentChange);
  const textWidth = Math.max(PERP_MARKET_CARD_TEXT_MIN_WIDTH, measureTextSync(market.baseSymbol, SYMBOL_TEXT_STYLE), priceChangeWidth);

  return Math.min(CARD_LAYOUT.maxWidth, Math.ceil(CARD_WIDTH_BASE + textWidth));
}

const TEXT_STATS = {
  decimalWidth: measureTextSync('.', PRICE_CHANGE_TEXT_STYLE),
  maxDigitWidth: measureTextSync('8', PRICE_CHANGE_TEXT_STYLE),
  percentageSymbolWidth: measureTextSync('%', PRICE_CHANGE_TEXT_STYLE),
};

function getStablePercentChangeWidth(percentChange: number): number {
  const leftOfDecimalDigits = Math.floor(Math.abs(percentChange)).toString().length;
  const leftDigitsWidth = leftOfDecimalDigits * TEXT_STATS.maxDigitWidth;
  const rightDigitsWidth = TEXT_STATS.maxDigitWidth * 2;

  return leftDigitsWidth + TEXT_STATS.decimalWidth + rightDigitsWidth + TEXT_STATS.percentageSymbolWidth;
}

function buildPerpMarketCardDisplay(market: PerpMarketWithMetadata, colorMode: ColorMode) {
  const { accentColor, iconUrl, priceChangeColors } = buildPerpMarketBaseDisplay(market, colorMode);
  return {
    accentColor,
    badgeTextColor: getHighContrastTextColorWorklet(accentColor, 4),
    cardColors: getValueForColorMode(CARD_COLORS, colorMode),
    chartColor: Number(market.priceChange['24h']) >= 0 ? priceChangeColors.positive : priceChangeColors.negative,
    iconUrl,
    priceChangeColors,
  };
}

function selectLivePriceChange24h(state: TokenData): string {
  return state.change.change24hPct;
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
