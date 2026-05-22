import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenSharedValue, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { Skeleton } from '@/components/Skeleton';
import { AnimatedText, Text, useColorMode } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { usePlacementCardTrackPress } from '@/features/discover/components/carousel/placementCardContext';
import { buildPerpMarketBaseDisplay, type PriceChangeColors } from '@/features/discover/components/perpMarketCards/perpMarketCardChrome';
import { PerpMarketIcon } from '@/features/discover/components/perpMarketCards/PerpMarketIcon';
import { PerpPriceChange } from '@/features/discover/components/perpMarketCards/PerpPriceChange';
import { usePerpMarketPress } from '@/features/discover/components/perpMarketCards/usePerpMarketPress';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { useHyperliquidLineChartsStore } from '@/features/perps/stores/hyperliquidLineChartsStore';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { formatPerpAssetPrice, selectFormattedMarkPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import { opacity } from '@/framework/ui/utils/opacity';
import { type TokenData } from '@/state/liveTokens/liveTokensStore';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

const ROW_HEIGHT = 76;
const ICON_SIZE = 40;
const SPARKLINE_LAYOUT = { height: 34, width: 64 };
const ROW_WIDTH = DEVICE_WIDTH - SCREEN_HORIZONTAL_PADDING * 2;
const ROW_BACKGROUND_COLORS = {
  dark: opacity('#202429', 0.4),
  light: 'rgba(255, 255, 255, 0.92)',
};
const ROW_LIGHT_GRADIENT_COLORS = ['rgba(131, 142, 153, 0.06)', 'rgba(131, 142, 153, 0)'] as const;

export function PerpMarketRowCard({ item }: { item: PerpMarketPlacementItem }) {
  const { colorMode, isDarkMode } = useColorMode();
  const { accentColor, iconUrl, priceChangeColors } = useMemo(
    () => buildPerpMarketBaseDisplay(item.market, colorMode),
    [colorMode, item.market]
  );
  const displayName = extractBaseSymbol(item.market.baseSymbol);
  const symbol = item.market.symbol;
  const initialPrice = useMemo(
    () => formatPerpAssetPrice(item.market.midPrice ?? item.market.price),
    [item.market.midPrice, item.market.price]
  );
  const initialPriceChange = item.market.priceChange['24h'];
  const tokenId = getHyperliquidTokenId(symbol);
  const livePrice = useLiveTokenSharedValue({
    initialValue: initialPrice,
    selector: selectFormattedMarkPrice,
    tokenId,
  });
  const livePriceChange = useLiveTokenValue({
    initialValue: initialPriceChange,
    selector: selectLivePriceChange24h,
    tokenId,
  });
  const trackPress = usePlacementCardTrackPress();
  const onPress = usePerpMarketPress(item.market, trackPress);
  const priceChangeColor = getPerpPriceChangeColor(livePriceChange, priceChangeColors);
  const rowBackgroundColor = getValueForColorMode(ROW_BACKGROUND_COLORS, colorMode);
  const rowGradientColors = isDarkMode ? ([opacity(accentColor, 0.16), opacity(accentColor, 0)] as const) : ROW_LIGHT_GRADIENT_COLORS;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <View style={[styles.row, { backgroundColor: rowBackgroundColor }]}>
        <LinearGradient
          colors={rowGradientColors}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <PerpMarketIcon
          accentColor={accentColor}
          badgePosition="top-right"
          badgeBorderColor={isDarkMode ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.07)'}
          baseSymbol={displayName}
          borderColor={accentColor}
          fallbackTextSize="13pt"
          iconUrl={iconUrl}
          leverage={item.market.maxLeverage}
          badgeShadowColor={isDarkMode ? '#000000' : accentColor}
          badgeShadowOpacity={isDarkMode ? 0.5 : 0.25}
          badgeTextColor={getHighContrastTextColorWorklet(accentColor, 4)}
          size={ICON_SIZE}
        />
        <View style={styles.textColumn}>
          <Text color="label" numberOfLines={1} size="17pt" weight="heavy">
            {displayName}
          </Text>
          <View style={styles.priceRow}>
            <AnimatedText color="labelSecondary" numberOfLines={1} size="15pt" weight="bold">
              {livePrice}
            </AnimatedText>
            <View style={styles.changeRow}>
              <PerpPriceChange
                arrowHeight={8}
                arrowSize="icon 12px"
                arrowWidth={12}
                initialPriceChange={initialPriceChange}
                priceChangeColors={priceChangeColors}
                symbol={symbol}
                textSize="15pt"
              />
            </View>
          </View>
        </View>
        <View pointerEvents="none" style={styles.sparklineContainer}>
          <SparklineChart
            chartId={symbol}
            color={priceChangeColor}
            height={SPARKLINE_LAYOUT.height}
            store={useHyperliquidLineChartsStore}
            width={SPARKLINE_LAYOUT.width}
          />
        </View>
      </View>
    </ButtonPressAnimation>
  );
}

export function PerpMarketRowCardSkeleton() {
  return <Skeleton borderRadius={24} height={ROW_HEIGHT} width={ROW_WIDTH} />;
}

function selectLivePriceChange24h(state: TokenData): string {
  return state.change.change24hPct;
}

function getPerpPriceChangeColor(priceChange: string, priceChangeColors: PriceChangeColors): string {
  return Number(priceChange) >= 0 ? priceChangeColors.positive : priceChangeColors.negative;
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 12,
    height: ROW_HEIGHT,
    overflow: 'hidden',
    paddingHorizontal: 12,
  },
  textColumn: {
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  changeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  sparklineContainer: {
    alignItems: 'flex-end',
    width: SPARKLINE_LAYOUT.width,
  },
});
