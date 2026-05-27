import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Skeleton } from '@/components/Skeleton';
import { Text, useColorMode } from '@/design-system';
import { getValueForColorMode, type ColorMode, type ContextualColorValue } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { SparklineChartWithLivePointer } from '@/features/charts/line/components/SparklineChartWithLivePointer';
import { MarketIcon } from '@/features/discover/components/markets/cards/MarketIcon';
import { MarketPriceChange } from '@/features/discover/components/markets/cards/MarketPriceChange';
import { useLiveChartColorSharedValue } from '@/features/discover/components/markets/hooks/useLiveChartColorSharedValue';
import {
  buildMarketBaseDisplay,
  LEVERAGE_BADGE_BORDER_COLORS,
  LEVERAGE_BADGE_SHADOW_OPACITIES,
  MARKET_SHADOW_COLOR,
} from '@/features/discover/components/markets/marketCardChrome';
import { type DiscoverCardAnalyticsContext } from '@/features/discover/components/surfaceSectionTypes';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

// ============ Types ========================================================== //

type MarketTileCardProps = {
  analyticsContext: DiscoverCardAnalyticsContext;
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
    badgeBorderColor: LEVERAGE_BADGE_BORDER_COLORS.dark,
    badgeShadowOpacity: LEVERAGE_BADGE_SHADOW_OPACITIES.dark,
    borderColor: 'rgba(255,255,255,0.05)',
    gradientOpacity: 0.16,
  },
  light: {
    backgroundColor: 'transparent',
    badgeBorderColor: LEVERAGE_BADGE_BORDER_COLORS.light,
    badgeShadowOpacity: LEVERAGE_BADGE_SHADOW_OPACITIES.light,
    borderColor: 'rgba(255,255,255,0.8)',
    gradientOpacity: 0.06,
  },
} satisfies ContextualColorValue<CardColors>;

// ============ Component ====================================================== //

export const MarketTileCard = memo(function MarketTileCard({
  analyticsContext,
  item,
  width = MARKET_TILE_CARD_WIDTH,
}: MarketTileCardProps) {
  const { colorMode, isDarkMode } = useColorMode();

  const onPress = () => {
    analytics.track(event.discoverCardPressed, {
      placementId: analyticsContext.placementId,
      placementSource: analyticsContext.placementSource,
      surfaceId: analyticsContext.surfaceId,
      placementTitle: analyticsContext.placementTitle,
      itemOrder: analyticsContext.itemOrder,
      itemId: analyticsContext.itemId,
      marketId: item.pressMetadata.marketId ?? item.id,
      marketName: item.pressMetadata.marketName,
      marketSlug: item.pressMetadata.marketSlug,
      marketSymbol: item.pressMetadata.marketSymbol,
    });
    item.onNavigate();
  };

  const { accentColor, badgeTextColor, cardColors, chartColor, iconUrl, priceChangeColors } = useMemo(
    () => buildMarketTileCardDisplay(item, colorMode),
    [colorMode, item]
  );
  const chartColorSharedValue = useLiveChartColorSharedValue(item, priceChangeColors);

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
              badgeShadowColor={isDarkMode ? MARKET_SHADOW_COLOR : accentColor}
              badgeShadowOpacity={cardColors.badgeShadowOpacity}
              badgeTextColor={badgeTextColor}
            />

            <View style={styles.priceChangeRow}>
              <MarketPriceChange
                arrowHeight={8}
                arrowSize="icon 12px"
                arrowWidth={UP_DOWN_ARROW_WIDTH}
                colorSharedValue={chartColorSharedValue}
                initialPriceChange={item.initialPriceChange}
                priceChangeSelector={item.priceChangeSelector}
                priceChangeColors={priceChangeColors}
                textSize="15pt"
                tokenId={item.liveTokenId}
              />
            </View>
          </View>

          <View pointerEvents="none" style={[styles.chartContainer, { width: chartWidth }]}>
            <SparklineChartWithLivePointer
              chartId={item.chartId}
              color={chartColor}
              colorSharedValue={chartColorSharedValue}
              height={CHART_HEIGHT}
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
    shadowColor: MARKET_SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  cardShadowLight: {
    elevation: 4,
    shadowColor: MARKET_SHADOW_COLOR,
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
