import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenSharedValue, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { Skeleton } from '@/components/Skeleton';
import { AnimatedText, Text, useColorMode } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { buildMarketBaseDisplay, getMarketPriceChangeColor } from '@/features/discover/components/marketCards/marketCardChrome';
import { MarketIcon } from '@/features/discover/components/marketCards/MarketIcon';
import { MarketPriceChange } from '@/features/discover/components/marketCards/MarketPriceChange';
import { usePlacementCardTrackPress } from '@/features/discover/components/marketPress/marketPressContext';
import { useMarketCardPress } from '@/features/discover/components/marketPress/useMarketCardPress';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { opacity } from '@/framework/ui/utils/opacity';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

const ROW_HEIGHT = 76;
const ICON_SIZE = 40;
const HORIZONTAL_PADDING = 12;
const SPARKLINE_LAYOUT = { height: 34, width: 64 };
const ROW_WIDTH = DEVICE_WIDTH - HORIZONTAL_PADDING * 2;
const ROW_BACKGROUND_COLORS = {
  dark: opacity('#202429', 0.4),
  light: 'rgba(255, 255, 255, 0.92)',
};
const ROW_LIGHT_GRADIENT_COLORS = ['rgba(131, 142, 153, 0.06)', 'rgba(131, 142, 153, 0)'] as const;

export function MarketRowCard({ item }: { item: MarketDisplayItem }) {
  const { colorMode, isDarkMode } = useColorMode();
  const { accentColor, iconUrl, priceChangeColors } = useMemo(() => buildMarketBaseDisplay(item, colorMode), [colorMode, item]);
  const livePrice = useLiveTokenSharedValue({
    initialValue: item.initialPrice,
    initialValueLastUpdated: item.initialPriceLastUpdated,
    selector: item.priceSelector,
    tokenId: item.liveTokenId,
  });
  const livePriceChange = useLiveTokenValue({
    initialValue: item.initialPriceChange,
    selector: item.priceChangeSelector,
    tokenId: item.liveTokenId,
  });
  const trackPress = usePlacementCardTrackPress();
  const onPress = useMarketCardPress({ metadata: item.pressMetadata, onPress: item.onNavigate, trackPress });
  const priceChangeColor = getMarketPriceChangeColor(livePriceChange, priceChangeColors);
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
        <MarketIcon
          accentColor={accentColor}
          badgePosition="top-right"
          badgeBorderColor={isDarkMode ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.07)'}
          borderColor={accentColor}
          fallbackText={item.displayName}
          fallbackTextSize="13pt"
          iconUrl={iconUrl}
          leverage={item.leverage}
          badgeShadowColor={isDarkMode ? '#000000' : accentColor}
          badgeShadowOpacity={isDarkMode ? 0.5 : 0.25}
          badgeTextColor={getHighContrastTextColorWorklet(accentColor, 4)}
          size={ICON_SIZE}
        />
        <View style={styles.textColumn}>
          <Text color="label" numberOfLines={1} size="17pt" weight="heavy">
            {item.displayName}
          </Text>
          <View style={styles.priceRow}>
            <AnimatedText color="labelSecondary" numberOfLines={1} size="15pt" weight="bold">
              {livePrice}
            </AnimatedText>
            <View style={styles.changeRow}>
              <MarketPriceChange
                arrowHeight={8}
                arrowSize="icon 12px"
                arrowWidth={12}
                initialPriceChange={item.initialPriceChange}
                priceChangeSelector={item.priceChangeSelector}
                priceChangeColors={priceChangeColors}
                textSize="15pt"
                tokenId={item.liveTokenId}
              />
            </View>
          </View>
        </View>
        <View pointerEvents="none" style={styles.sparklineContainer}>
          <SparklineChart
            chartId={item.chartId}
            color={priceChangeColor}
            height={SPARKLINE_LAYOUT.height}
            maxPoints={item.chartMaxPoints}
            store={item.chartStore}
            width={SPARKLINE_LAYOUT.width}
          />
        </View>
      </View>
    </ButtonPressAnimation>
  );
}

export function MarketRowCardSkeleton() {
  return <Skeleton borderRadius={24} height={ROW_HEIGHT} width={ROW_WIDTH} />;
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
