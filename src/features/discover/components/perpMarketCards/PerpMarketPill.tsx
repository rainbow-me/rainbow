import React, { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { AnimatedText, Text, useColorMode } from '@/design-system';
import { getValueForColorMode, type ColorMode, type ContextualColorValue } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { CarouselCardSkeleton } from '@/features/discover/components/carousel/CarouselCardSkeleton';
import { usePlacementCardTrackPress } from '@/features/discover/components/carousel/placementCardContext';
import { buildPerpMarketBaseDisplay } from '@/features/discover/components/perpMarketCards/perpMarketCardChrome';
import { PerpMarketIcon } from '@/features/discover/components/perpMarketCards/PerpMarketIcon';
import { PerpPriceChange } from '@/features/discover/components/perpMarketCards/PerpPriceChange';
import { usePerpMarketPress } from '@/features/discover/components/perpMarketCards/usePerpMarketPress';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { convertStoredPerpPriceChangeToPercent, getHyperliquidTokenId } from '@/features/perps/utils';
import { formatPerpAssetPrice, selectFormattedMarkPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { measureTextSync, type MeasureTextProps } from '@/utils/measureText';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

// ============ Types ========================================================== //

export type PerpMarketPillProps = {
  market: PerpMarketWithMetadata;
  style?: StyleProp<ViewStyle>;
};

type PillColors = {
  backgroundColor: string;
  badgeBorderColor: string;
  badgeShadowOpacity: number;
  borderColor: string;
  gradientOpacity: number;
};

// ============ Layout ========================================================= //

const ICON_IMAGE_PADDING = 4;
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

export const PERP_MARKET_PILL_HEIGHT = ICON_SIZE + PILL_LAYOUT.paddingVertical * 2;

/** Width used by the skeleton placeholder before any real pills are measured. */
const PERP_MARKET_PILL_SKELETON_WIDTH = 220;

// ============ Colors ========================================================= //

const PILL_COLORS = {
  dark: {
    backgroundColor: 'rgba(32, 36, 41, 0.3)',
    badgeBorderColor: 'rgba(255, 255, 255, 0.24)',
    badgeShadowOpacity: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gradientOpacity: 0.16,
  },
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    badgeBorderColor: 'rgba(0, 0, 0, 0.07)',
    badgeShadowOpacity: 0.25,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    gradientOpacity: 0.06,
  },
} satisfies ContextualColorValue<PillColors>;

// ============ Component ====================================================== //

export const PerpMarketPill = memo(function PerpMarketPill({ market, style }: PerpMarketPillProps) {
  const { colorMode, isDarkMode } = useColorMode();
  const symbol = market.symbol;
  const displayName = extractBaseSymbol(market.baseSymbol);

  const trackPress = usePlacementCardTrackPress();
  const onPress = usePerpMarketPress(market, trackPress);

  const { accentColor, badgeTextColor, iconUrl, pillColors, priceChangeColors } = useMemo(
    () => buildPerpMarketPillDisplay(market, colorMode),
    [colorMode, market]
  );

  const initialPrice = useMemo(() => formatPerpAssetPrice(market.midPrice ?? market.price), [market.midPrice, market.price]);

  const livePrice = useLiveTokenSharedValue({
    initialValue: initialPrice,
    selector: selectFormattedMarkPrice,
    tokenId: getHyperliquidTokenId(symbol),
  });

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={[styles.pressable, style]}>
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
            <PerpMarketIcon
              accentColor={accentColor}
              baseSymbol={market.baseSymbol}
              borderColor={accentColor}
              fallbackTextSize="15pt"
              iconUrl={iconUrl}
              size={ICON_SIZE}
              leverage={market.maxLeverage}
              badgeBorderColor={pillColors.badgeBorderColor}
              badgeShadowColor={isDarkMode ? '#000000' : accentColor}
              badgeShadowOpacity={pillColors.badgeShadowOpacity}
              badgeTextColor={badgeTextColor}
              badgePosition="top-right"
            />
            <View style={styles.textColumn}>
              <Text color="label" numberOfLines={1} size="17pt" weight="bold">
                {displayName}
              </Text>

              <View style={styles.priceRow}>
                <AnimatedText color="labelSecondary" numberOfLines={1} size="13pt" weight="bold">
                  {livePrice}
                </AnimatedText>

                <View style={styles.changeRow}>
                  <PerpPriceChange
                    arrowHeight={7}
                    arrowSize="icon 10px"
                    arrowWidth={UP_DOWN_ARROW_WIDTH}
                    initialPriceChange={market.priceChange['24h']}
                    priceChangeColors={priceChangeColors}
                    symbol={symbol}
                    textSize="13pt"
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

export function PerpMarketPillSkeleton() {
  return (
    <CarouselCardSkeleton
      borderRadius={PILL_LAYOUT.borderRadius}
      height={PERP_MARKET_PILL_HEIGHT}
      width={PERP_MARKET_PILL_SKELETON_WIDTH}
    />
  );
}

// ============ Display Helpers ================================================ //

function buildPerpMarketPillDisplay(market: PerpMarketWithMetadata, colorMode: ColorMode) {
  const base = buildPerpMarketBaseDisplay(market, colorMode);
  return {
    ...base,
    badgeTextColor: getHighContrastTextColorWorklet(base.accentColor, 4),
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

export function computePerpPillWidth(market: PerpMarketWithMetadata): number {
  const displayName = extractBaseSymbol(market.baseSymbol);
  const nameWidth = measureTextSync(displayName, NAME_TEXT_STYLE);

  const priceFormatted = formatPerpAssetPrice(market.midPrice ?? market.price);
  const priceWidth = measureTextSync(priceFormatted, PRICE_TEXT_STYLE);

  const percentChange = convertStoredPerpPriceChangeToPercent(market.priceChange['24h']);
  const priceChangeWidth = UP_DOWN_ARROW_WIDTH + CHANGE_ROW_GAP + getStablePerpPillPercentChangeWidth(percentChange);

  const textWidth = Math.max(nameWidth, priceWidth + PRICE_ROW_GAP + priceChangeWidth);
  return Math.ceil(PILL_WIDTH_BASE + textWidth);
}

function getStablePerpPillPercentChangeWidth(percentChange: number): number {
  const leftOfDecimalDigits = Math.floor(Math.abs(percentChange)).toString().length;
  const leftDigitsWidth = leftOfDecimalDigits * PILL_TEXT_STATS.maxDigitWidth;
  const rightDigitsWidth = PILL_TEXT_STATS.maxDigitWidth * 2;
  return leftDigitsWidth + PILL_TEXT_STATS.decimalWidth + rightDigitsWidth + PILL_TEXT_STATS.percentageSymbolWidth;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  badgePosition: {
    shadowRadius: 5,
    top: -ICON_IMAGE_PADDING - 3.5,
    right: -ICON_IMAGE_PADDING - 4,
  },
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
    height: PERP_MARKET_PILL_HEIGHT,
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
    height: PERP_MARKET_PILL_HEIGHT,
  },
  pillShadowDark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  pillShadowLight: {
    elevation: 3,
    shadowColor: '#000000',
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
