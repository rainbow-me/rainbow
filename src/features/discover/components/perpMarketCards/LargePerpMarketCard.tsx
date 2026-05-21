import React, { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Text, useColorMode } from '@/design-system';
import { getValueForColorMode, type ColorMode, type ContextualColorValue } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { CarouselCardSkeleton } from '@/features/discover/components/carousel/CarouselCardSkeleton';
import { usePlacementCardTrackPress } from '@/features/discover/components/carousel/placementCardContext';
import { buildPerpMarketBaseDisplay } from '@/features/discover/components/perpMarketCards/perpMarketCardChrome';
import { PerpMarketIcon } from '@/features/discover/components/perpMarketCards/PerpMarketIcon';
import { PerpPriceChange } from '@/features/discover/components/perpMarketCards/PerpPriceChange';
import { usePerpMarketPress } from '@/features/discover/components/perpMarketCards/usePerpMarketPress';
import { useHyperliquidLineChartsStore } from '@/features/perps/stores/hyperliquidLineChartsStore';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { formatPerpAssetPrice, selectFormattedMarkPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

// ============ Types ========================================================== //

type LargePerpMarketCardProps = {
  market: PerpMarketWithMetadata;
  style?: StyleProp<ViewStyle>;
  width?: number;
};

type CardColors = {
  backgroundColor: string;
  badgeBorderColor: string;
  badgeShadowOpacity: number;
  borderColor: string;
  gradientOpacity: number;
};

// ============ Layout ========================================================= //

export const LARGE_PERP_MARKET_CARD_WIDTH = 176;
export const LARGE_PERP_MARKET_CARD_HEIGHT = 186;

const CARD_LAYOUT = {
  borderRadius: 24,
  borderWidth: THICKER_BORDER_WIDTH,
  paddingBottom: 18,
  paddingHorizontal: 16,
  paddingTop: 16,
};

const ICON_SIZE = 52;

const UP_DOWN_ARROW_WIDTH = 12;
const PRICE_CHANGE_ROW_GAP = 2;

const CHART_HEIGHT = 52;
const CHART_MARGIN_TOP = 6;
const TEXT_GAP = 12;

const SYMBOL_TEXT_STYLE = { size: '17pt', weight: 'bold' } as const;
const MARK_PRICE_TEXT_STYLE = { size: '15pt', weight: 'bold' } as const;

// ============ Colors ========================================================= //

const CARD_COLORS = {
  dark: {
    backgroundColor: 'rgba(32,36,41,0.4)',
    badgeBorderColor: 'rgba(255,255,255,0.24)',
    badgeShadowOpacity: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    gradientOpacity: 0.16,
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

export const LargePerpMarketCard = memo(function LargePerpMarketCard({
  market,
  style,
  width = LARGE_PERP_MARKET_CARD_WIDTH,
}: LargePerpMarketCardProps) {
  const { colorMode, isDarkMode } = useColorMode();
  const symbol = market.symbol;
  const displayBaseSymbol = extractBaseSymbol(market.baseSymbol);
  const initialPrice = market.midPrice ?? market.price;

  const trackPress = usePlacementCardTrackPress();
  const onPress = usePerpMarketPress(market, trackPress);

  const { accentColor, badgeTextColor, cardColors, chartColor, iconUrl, priceChangeColors } = useMemo(
    () => buildLargePerpMarketCardDisplay(market, colorMode),
    [colorMode, market]
  );

  const chartWidth = width - CARD_LAYOUT.paddingHorizontal * 2;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={[styles.pressable, { width }, style]}>
      <View style={[styles.cardShadow, isDarkMode ? styles.cardShadowDark : styles.cardShadowLight]}>
        <View style={[styles.card, { backgroundColor: cardColors.backgroundColor }]}>
          <LinearGradient
            colors={[opacity(accentColor, cardColors.gradientOpacity), opacity(accentColor, 0)]}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={styles.cardGradient}
          />

          <View style={styles.topRow}>
            <PerpMarketIcon
              accentColor={accentColor}
              baseSymbol={displayBaseSymbol}
              borderColor={accentColor}
              imageBorderGap={4 / 3}
              fallbackTextSize="17pt"
              iconUrl={iconUrl}
              size={ICON_SIZE}
              leverage={market.maxLeverage}
              badgeBorderColor={cardColors.badgeBorderColor}
              badgeShadowColor={isDarkMode ? '#000000' : accentColor}
              badgeShadowOpacity={cardColors.badgeShadowOpacity}
              badgeTextColor={badgeTextColor}
            />

            <View style={styles.priceChangeRow}>
              <PerpPriceChange
                arrowHeight={8}
                arrowSize="icon 12px"
                arrowWidth={UP_DOWN_ARROW_WIDTH}
                initialPriceChange={market.priceChange['24h']}
                priceChangeColors={priceChangeColors}
                symbol={symbol}
                textSize="15pt"
              />
            </View>
          </View>

          <View pointerEvents="none" style={[styles.chartContainer, { width: chartWidth }]}>
            <SparklineChart
              chartId={symbol}
              color={chartColor}
              height={CHART_HEIGHT}
              showLivePointer
              store={useHyperliquidLineChartsStore}
              width={chartWidth}
            />
          </View>

          <View style={styles.textColumn}>
            <Text color="label" numberOfLines={1} size={SYMBOL_TEXT_STYLE.size} weight={SYMBOL_TEXT_STYLE.weight}>
              {displayBaseSymbol}
            </Text>
            <LiveTokenText
              autoSubscriptionEnabled
              color="labelSecondary"
              initialValue={formatPerpAssetPrice(initialPrice)}
              initialValueLastUpdated={0}
              numberOfLines={1}
              selector={selectFormattedMarkPrice}
              size={MARK_PRICE_TEXT_STYLE.size}
              tokenId={getHyperliquidTokenId(symbol)}
              weight={MARK_PRICE_TEXT_STYLE.weight}
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

// ============ Skeleton ======================================================= //

export function LargePerpMarketCardSkeleton({ width = LARGE_PERP_MARKET_CARD_WIDTH }: { width?: number } = {}) {
  return <CarouselCardSkeleton borderRadius={CARD_LAYOUT.borderRadius} height={LARGE_PERP_MARKET_CARD_HEIGHT} width={width} />;
}

// ============ Display Helpers =============================================== //

function buildLargePerpMarketCardDisplay(market: PerpMarketWithMetadata, colorMode: ColorMode) {
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

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: CARD_LAYOUT.borderRadius,
    height: LARGE_PERP_MARKET_CARD_HEIGHT,
    overflow: 'hidden',
    paddingBottom: CARD_LAYOUT.paddingBottom,
    paddingHorizontal: CARD_LAYOUT.paddingHorizontal,
    paddingTop: CARD_LAYOUT.paddingTop,
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
    height: LARGE_PERP_MARKET_CARD_HEIGHT,
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
  chartContainer: {
    height: CHART_HEIGHT,
    marginTop: CHART_MARGIN_TOP,
  },
  pressable: {
    width: LARGE_PERP_MARKET_CARD_WIDTH,
  },
  priceChangeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: PRICE_CHANGE_ROW_GAP,
  },
  textColumn: {
    flex: 1,
    gap: TEXT_GAP,
    justifyContent: 'flex-end',
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});
