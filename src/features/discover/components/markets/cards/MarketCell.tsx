import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ImgixImage from '@/components/images/ImgixImage';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Skeleton } from '@/components/Skeleton';
import { Box, globalColors, Text, useColorMode } from '@/design-system';
import { getValueForColorMode, type ContextualColorValue } from '@/design-system/color/palettes';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { MarketIcon } from '@/features/discover/components/markets/cards/MarketIcon';
import { MarketPriceChange } from '@/features/discover/components/markets/cards/MarketPriceChange';
import { useLiveChartColorSharedValue } from '@/features/discover/components/markets/hooks/useLiveChartColorSharedValue';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { usePriceChangeColors } from '@/framework/ui/price/usePriceChangeColors';
import { opacity } from '@/framework/ui/utils/opacity';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

const TOKEN_SPARKLINE_LAYOUT = { height: 34, width: 64 };

type CellColors = {
  badgeBorderColor: string;
  badgeShadowOpacity: number;
  backgroundColor: string;
  borderColor: string;
};

const TOKEN_CARD_COLORS = {
  dark: {
    badgeBorderColor: opacity(globalColors.white100, 0.24),
    badgeShadowOpacity: 0.5,
    backgroundColor: opacity('#202429', 0.4),
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  light: {
    badgeBorderColor: opacity(globalColors.grey100, 0.07),
    badgeShadowOpacity: 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
} satisfies ContextualColorValue<CellColors>;

export function MarketCellSkeleton() {
  return <Skeleton borderRadius={24} height={64} width="100%" />;
}

export const MarketCell = memo(function MarketCell({ item, onPress }: { item: MarketDisplayItem; onPress?: () => void }) {
  const { colorMode, isDarkMode } = useColorMode();
  const priceChangeColors = usePriceChangeColors();
  const chartColorSharedValue = useLiveChartColorSharedValue(item, priceChangeColors);
  const tokenCardColors = getValueForColorMode(TOKEN_CARD_COLORS, colorMode);
  const leverageBadgeTextColor = useMemo(() => getHighContrastTextColorWorklet(item.accentColor, 4), [item.accentColor]);
  const gradientColors = isDarkMode
    ? ([opacity(item.accentColor, 0.16), opacity(item.accentColor, 0)] as const)
    : (['rgba(131, 142, 153, 0.06)', 'rgba(131, 142, 153, 0)'] as const);

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <Box
        borderColor={{ custom: tokenCardColors.borderColor }}
        borderRadius={24}
        borderWidth={isDarkMode ? 1 : 2}
        padding="12px"
        paddingRight={{ custom: 18 }}
        backgroundColor={tokenCardColors.backgroundColor}
      >
        <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.contentRow}>
          {item.leverage !== undefined ? (
            <MarketIcon
              accentColor={item.accentColor}
              badgeBorderColor={tokenCardColors.badgeBorderColor}
              badgePosition="top-right"
              badgeShadowColor={isDarkMode ? globalColors.grey100 : item.accentColor}
              badgeShadowOpacity={tokenCardColors.badgeShadowOpacity}
              badgeTextColor={leverageBadgeTextColor}
              borderColor={item.accentColor}
              fallbackText={item.displayName}
              fallbackTextSize="13pt"
              iconUrl={item.iconUrl}
              leverage={item.leverage}
              size={40}
            />
          ) : item.iconUrl ? (
            <ImgixImage enableFasterImage size={40} source={{ uri: item.iconUrl }} style={styles.icon} />
          ) : (
            <View style={[styles.iconFallback, { borderColor: item.accentColor }]}>
              <Text align="center" color={{ custom: item.accentColor }} size="13pt" weight="heavy">
                {item.displayName.slice(0, 1)}
              </Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <View style={styles.namePriceColumn}>
              <Text size="17pt" weight="heavy" color="label" numberOfLines={1}>
                {item.displayName}
              </Text>
              <View style={styles.priceRow}>
                <LiveTokenText
                  tokenId={item.liveTokenId}
                  initialValueLastUpdated={item.initialPriceLastUpdated}
                  initialValue={item.initialPrice}
                  selector={item.priceSelector}
                  color="labelSecondary"
                  numberOfLines={1}
                  size="15pt"
                  weight="bold"
                />
                <MarketPriceChange
                  arrowHeight={8}
                  arrowSize="icon 12px"
                  arrowWidth={12}
                  colorSharedValue={chartColorSharedValue}
                  initialPriceChange={item.initialPriceChange}
                  priceChangeSelector={item.priceChangeSelector}
                  priceChangeColors={priceChangeColors}
                  textSize="15pt"
                  tokenId={item.liveTokenId}
                />
              </View>
            </View>
            <View style={styles.sparklineContainer}>
              <SparklineChart
                chartId={item.chartId}
                color={item.chartColor}
                height={TOKEN_SPARKLINE_LAYOUT.height}
                store={item.chartStore}
                width={TOKEN_SPARKLINE_LAYOUT.width}
              />
            </View>
          </View>
        </View>
      </Box>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardBody: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  namePriceColumn: {
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparklineContainer: {
    alignItems: 'flex-end',
    marginRight: 4,
    width: TOKEN_SPARKLINE_LAYOUT.width,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 40 / 2,
  },
  iconFallback: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
