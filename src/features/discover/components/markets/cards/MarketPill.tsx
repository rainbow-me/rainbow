import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { Skeleton } from '@/components/Skeleton';
import { AnimatedText, globalColors, Text, useColorMode } from '@/design-system';
import { getValueForColorMode, type ColorMode, type ContextualColorValue } from '@/design-system/color/palettes';
import { usePriceChangeColors } from '@/design-system/color/usePriceChangeColors';
import { Border } from '@/design-system/components/Border/Border';
import { MarketIcon } from '@/features/discover/components/markets/cards/MarketIcon';
import { MarketPriceChange } from '@/features/discover/components/markets/cards/MarketPriceChange';
import { type DiscoverCardAnalyticsContext } from '@/features/discover/components/surfaceSectionTypes';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { convertStoredPerpPriceChangeToPercent } from '@/features/perps/utils';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { measureTextSync, type MeasureTextProps } from '@/utils/measureText';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

// ============ Types ========================================================== //

type MarketPillProps = {
  analyticsContext: DiscoverCardAnalyticsContext;
  item: MarketDisplayItem;
};

export type MarketPillWidthInput = {
  displayName: string;
  initialPrice: string;
  initialPriceChange: string;
};

type PillColors = {
  backgroundColor: string;
  badgeBorderColor: string;
  badgeShadowOpacity: number;
  borderColor: string;
  gradientOpacity: number;
};

// ============ Layout ========================================================= //

const ICON_SIZE = 48;
const UP_DOWN_ARROW_WIDTH = 10;

const PILL_LAYOUT = {
  borderRadius: 99,
  borderWidth: THICKER_BORDER_WIDTH,
  gap: 12,
  paddingLeft: 10,
  paddingRight: 22,
  paddingVertical: 10,
};

export const MARKET_PILL_HEIGHT = ICON_SIZE + PILL_LAYOUT.paddingVertical * 2;

/** Width used by the skeleton placeholder before any real pills are measured. */
const MARKET_PILL_SKELETON_WIDTH = 220;

// ============ Colors ========================================================= //

const PILL_COLORS = {
  dark: {
    backgroundColor: 'rgba(32, 36, 41, 0.3)',
    badgeBorderColor: opacity(globalColors.white100, 0.24),
    badgeShadowOpacity: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gradientOpacity: 0.16,
  },
  light: {
    backgroundColor: 'transparent',
    badgeBorderColor: opacity(globalColors.grey100, 0.07),
    badgeShadowOpacity: 0.25,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gradientOpacity: 0.06,
  },
} satisfies ContextualColorValue<PillColors>;

// ============ Component ====================================================== //

export const MarketPill = memo(function MarketPill({ analyticsContext, item }: MarketPillProps) {
  const { colorMode, isDarkMode } = useColorMode();
  const priceChangeColors = usePriceChangeColors();

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
    if (analyticsContext.placementId) {
      analytics.track(event.placementInteraction, {
        placementId: analyticsContext.placementId,
        source: analyticsContext.placementSource,
        surfaceId: analyticsContext.surfaceId,
        type: analyticsContext.placementType,
      });
    }
    item.onNavigate();
  };

  const { accentColor, badgeTextColor, iconUrl, pillColors } = useMemo(() => buildMarketPillDisplay(item, colorMode), [colorMode, item]);

  const livePrice = useLiveTokenSharedValue({
    initialValue: item.initialPrice,
    initialValueLastUpdated: item.initialPriceLastUpdated,
    selector: item.priceSelector,
    tokenId: item.liveTokenId,
  });

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={styles.pressable}>
      <View style={[styles.pillShadow, isDarkMode ? styles.pillShadowDark : styles.pillShadowLight]}>
        <View style={[styles.pill, { backgroundColor: pillColors.backgroundColor }]}>
          <LinearGradient
            colors={[opacity(accentColor, pillColors.gradientOpacity), opacity(accentColor, 0)]}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={styles.pillGradient}
          />

          <View style={styles.contentRow}>
            <MarketIcon
              accentColor={accentColor}
              borderColor={accentColor}
              fallbackText={item.displayName}
              fallbackTextSize="15pt"
              iconUrl={iconUrl}
              size={ICON_SIZE}
              leverage={item.leverage}
              badgeBorderColor={pillColors.badgeBorderColor}
              badgeShadowColor={isDarkMode ? globalColors.grey100 : accentColor}
              badgeShadowOpacity={pillColors.badgeShadowOpacity}
              badgeTextColor={badgeTextColor}
              badgePosition="top-right"
            />
            <View style={styles.textColumn}>
              <Text color="label" numberOfLines={1} size="17pt" weight="bold">
                {item.displayName}
              </Text>

              <View style={styles.priceRow}>
                <AnimatedText color="labelSecondary" numberOfLines={1} size="13pt" weight="bold">
                  {livePrice}
                </AnimatedText>

                <View style={styles.changeRow}>
                  <MarketPriceChange
                    arrowHeight={7}
                    arrowSize="icon 10px"
                    arrowWidth={UP_DOWN_ARROW_WIDTH}
                    initialPriceChange={item.initialPriceChange}
                    priceChangeSelector={item.priceChangeSelector}
                    priceChangeColors={priceChangeColors}
                    textSize="13pt"
                    tokenId={item.liveTokenId}
                  />
                </View>
              </View>
            </View>
          </View>

          <Border
            borderColor={{ custom: pillColors.borderColor }}
            borderRadius={PILL_LAYOUT.borderRadius}
            borderWidth={PILL_LAYOUT.borderWidth}
            enableInLightMode
          />
        </View>
      </View>
    </ButtonPressAnimation>
  );
});

// ============ Skeleton ======================================================= //

export function MarketPillSkeleton() {
  return <Skeleton borderRadius={PILL_LAYOUT.borderRadius} height={MARKET_PILL_HEIGHT} width={MARKET_PILL_SKELETON_WIDTH} />;
}

// ============ Display Helpers ================================================ //

function buildMarketPillDisplay(item: MarketDisplayItem, colorMode: ColorMode) {
  return {
    accentColor: item.accentColor,
    badgeTextColor: getHighContrastTextColorWorklet(item.accentColor, 4),
    iconUrl: item.iconUrl,
    pillColors: getValueForColorMode(PILL_COLORS, colorMode),
  };
}

// ============ Layout Measurement ============================================ //

const NAME_TEXT_STYLE = { size: '17pt', weight: 'bold' } satisfies MeasureTextProps;
const PRICE_TEXT_STYLE = { size: '13pt', weight: 'bold' } satisfies MeasureTextProps;

const PRICE_ROW_GAP = 8;
const CHANGE_ROW_GAP = 2;

const PILL_WIDTH_BASE = PILL_LAYOUT.paddingLeft + ICON_SIZE + PILL_LAYOUT.gap + PILL_LAYOUT.paddingRight;

const PILL_TEXT_STATS = {
  decimalWidth: measureTextSync('.', PRICE_TEXT_STYLE),
  maxDigitWidth: measureTextSync('8', PRICE_TEXT_STYLE),
  percentageSymbolWidth: measureTextSync('%', PRICE_TEXT_STYLE),
};

export function computeMarketPillWidth(item: MarketPillWidthInput): number {
  const nameWidth = measureTextSync(item.displayName, NAME_TEXT_STYLE);

  const priceWidth = measureTextSync(item.initialPrice, PRICE_TEXT_STYLE);

  const priceChange = convertStoredPerpPriceChangeToPercent(item.initialPriceChange);
  const priceChangeWidth = UP_DOWN_ARROW_WIDTH + CHANGE_ROW_GAP + getStableMarketPillPercentChangeWidth(priceChange);

  const textWidth = Math.max(nameWidth, priceWidth + PRICE_ROW_GAP + priceChangeWidth);
  return Math.ceil(PILL_WIDTH_BASE + textWidth);
}

function getStableMarketPillPercentChangeWidth(percentChange: number): number {
  const leftOfDecimalDigits = Math.floor(Math.abs(percentChange)).toString().length;
  const leftDigitsWidth = leftOfDecimalDigits * PILL_TEXT_STATS.maxDigitWidth;
  const rightDigitsWidth = PILL_TEXT_STATS.maxDigitWidth * 2;
  return leftDigitsWidth + PILL_TEXT_STATS.decimalWidth + rightDigitsWidth + PILL_TEXT_STATS.percentageSymbolWidth;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  changeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: PILL_LAYOUT.gap,
  },
  pill: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: PILL_LAYOUT.borderRadius,
    flexDirection: 'row',
    height: MARKET_PILL_HEIGHT,
    paddingLeft: PILL_LAYOUT.paddingLeft,
    paddingRight: PILL_LAYOUT.paddingRight,
    paddingVertical: PILL_LAYOUT.paddingVertical,
  },
  pillGradient: {
    ...StyleSheet.absoluteFillObject,
    borderCurve: 'continuous',
    borderRadius: PILL_LAYOUT.borderRadius,
  },
  pillShadow: {
    borderCurve: 'continuous',
    borderRadius: PILL_LAYOUT.borderRadius,
    height: MARKET_PILL_HEIGHT,
  },
  pillShadowDark: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  pillShadowLight: {
    elevation: 3,
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  pressable: {
    alignSelf: 'flex-start',
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  textColumn: {
    flexShrink: 1,
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
