import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Skeleton } from '@/components/Skeleton';
import { Text, useColorMode } from '@/design-system';
import { getValueForColorMode, type ColorMode, type ContextualColorValue } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { buildMarketBaseDisplay } from '@/features/discover/components/marketCards/marketCardChrome';
import { MarketIcon } from '@/features/discover/components/marketCards/MarketIcon';
import { MarketPriceChange } from '@/features/discover/components/marketCards/MarketPriceChange';
import { usePlacementCardTrackPress } from '@/features/discover/components/marketPress/marketPressContext';
import { useMarketCardPress } from '@/features/discover/components/marketPress/useMarketCardPress';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

// ============ Types ========================================================== //

type MarketTileCardProps = {
  item: MarketDisplayItem;
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

export const MARKET_TILE_CARD_WIDTH = 176;
export const MARKET_TILE_CARD_HEIGHT = 186;

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
    backgroundColor: 'transparent',
    badgeBorderColor: 'rgba(0,0,0,0.07)',
    badgeShadowOpacity: 0.25,
    borderColor: 'rgba(255,255,255,0.8)',
    gradientOpacity: 0.06,
  },
} satisfies ContextualColorValue<CardColors>;

// ============ Component ====================================================== //

export const MarketTileCard = memo(function MarketTileCard({ item, width = MARKET_TILE_CARD_WIDTH }: MarketTileCardProps) {
  const { colorMode, isDarkMode } = useColorMode();

  const trackPress = usePlacementCardTrackPress();
  const onPress = useMarketCardPress({ metadata: item.pressMetadata, onPress: item.onNavigate, trackPress });

  const { accentColor, badgeTextColor, cardColors, chartColor, iconUrl, priceChangeColors } = useMemo(
    () => buildMarketTileCardDisplay(item, colorMode),
    [colorMode, item]
  );

  const chartWidth = width - CARD_LAYOUT.paddingHorizontal * 2;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={[styles.pressable, { width }]}>
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
            <MarketIcon
              accentColor={accentColor}
              borderColor={accentColor}
              fallbackText={item.displayName}
              imageBorderGap={4 / 3}
              fallbackTextSize="17pt"
              iconUrl={iconUrl}
              size={ICON_SIZE}
              leverage={item.leverage}
              badgeBorderColor={cardColors.badgeBorderColor}
              badgeShadowColor={isDarkMode ? '#000000' : accentColor}
              badgeShadowOpacity={cardColors.badgeShadowOpacity}
              badgeTextColor={badgeTextColor}
            />

            <View style={styles.priceChangeRow}>
              <MarketPriceChange
                arrowHeight={8}
                arrowSize="icon 12px"
                arrowWidth={UP_DOWN_ARROW_WIDTH}
                initialPriceChange={item.initialPriceChange}
                priceChangeSelector={item.priceChangeSelector}
                priceChangeColors={priceChangeColors}
                textSize="15pt"
                tokenId={item.liveTokenId}
              />
            </View>
          </View>

          <View pointerEvents="none" style={[styles.chartContainer, { width: chartWidth }]}>
            <SparklineChart
              chartId={item.chartId}
              color={chartColor}
              height={CHART_HEIGHT}
              showLivePointer
              store={item.chartStore}
              width={chartWidth}
            />
          </View>

          <View style={styles.textColumn}>
            <Text color="label" numberOfLines={1} size={SYMBOL_TEXT_STYLE.size} weight={SYMBOL_TEXT_STYLE.weight}>
              {item.displayName}
            </Text>
            <LiveTokenText
              autoSubscriptionEnabled
              color="labelSecondary"
              initialValue={item.initialPrice}
              initialValueLastUpdated={item.initialPriceLastUpdated}
              numberOfLines={1}
              selector={item.priceSelector}
              size={MARK_PRICE_TEXT_STYLE.size}
              tokenId={item.liveTokenId}
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

export function MarketTileCardSkeleton({ width = MARKET_TILE_CARD_WIDTH }: { width?: number } = {}) {
  return <Skeleton borderRadius={CARD_LAYOUT.borderRadius} height={MARKET_TILE_CARD_HEIGHT} width={width} />;
}

// ============ Display Helpers =============================================== //

function buildMarketTileCardDisplay(item: MarketDisplayItem, colorMode: ColorMode) {
  const { accentColor, iconUrl, priceChangeColors } = buildMarketBaseDisplay(item, colorMode);
  return {
    accentColor,
    badgeTextColor: getHighContrastTextColorWorklet(accentColor, 4),
    cardColors: getValueForColorMode(CARD_COLORS, colorMode),
    chartColor: item.chartColor,
    iconUrl,
    priceChangeColors,
  };
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: CARD_LAYOUT.borderRadius,
    height: MARKET_TILE_CARD_HEIGHT,
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
    height: MARKET_TILE_CARD_HEIGHT,
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
    width: MARKET_TILE_CARD_WIDTH,
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
