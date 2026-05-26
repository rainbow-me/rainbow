import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ImgixImage from '@/components/images/ImgixImage';
import { LiveTokenText, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { Skeleton } from '@/components/Skeleton';
import { Box, Text, useColorMode } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { getMarketPriceChangeColor, getMarketPriceChangeColors } from '@/features/discover/components/marketCards/marketCardChrome';
import { MarketIcon } from '@/features/discover/components/marketCards/MarketIcon';
import { MarketPriceChange } from '@/features/discover/components/marketCards/MarketPriceChange';
import { usePlacementCardTrackPress } from '@/features/discover/components/marketPress/marketPressContext';
import { useMarketCardPress } from '@/features/discover/components/marketPress/useMarketCardPress';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { opacity } from '@/framework/ui/utils/opacity';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

const TOKEN_CARD_BORDER_RADIUS = 24;
const TOKEN_CARD_HEIGHT = 64;
const HORIZONTAL_PADDING = 12;
const TOKEN_CARD_WIDTH = DEVICE_WIDTH - HORIZONTAL_PADDING * 2;
const TOKEN_SPARKLINE_LAYOUT = { height: 34, width: 64 };
const TOKEN_CARD_BACKGROUND_COLORS = {
  dark: opacity('#202429', 0.4),
  light: 'rgba(255, 255, 255, 0.92)',
};
const TOKEN_CARD_BORDER_COLORS = {
  dark: 'rgba(255, 255, 255, 0.05)',
  light: 'rgba(255, 255, 255, 0.8)',
};
const LEVERAGE_BADGE_BORDER_COLORS = {
  dark: 'rgba(255, 255, 255, 0.24)',
  light: 'rgba(0, 0, 0, 0.07)',
};
const LEVERAGE_BADGE_SHADOW_OPACITIES = {
  dark: 0.5,
  light: 0.25,
};
const UP_DOWN_ARROW_WIDTH = 12;

export function MarketCell({ item }: { item: MarketDisplayItem }) {
  return <MarketCellCard item={item} />;
}

export function MarketCellSkeleton() {
  return <Skeleton borderRadius={TOKEN_CARD_BORDER_RADIUS} height={TOKEN_CARD_HEIGHT} width={TOKEN_CARD_WIDTH} />;
}

function MarketCellCard({ item }: { item: MarketDisplayItem }) {
  const { colorMode, isDarkMode } = useColorMode();
  const trackPress = usePlacementCardTrackPress();
  const livePriceChange = useLiveTokenValue({
    initialValue: item.initialPriceChange,
    selector: item.priceChangeSelector,
    tokenId: item.liveTokenId,
  });
  const priceChangeColors = getMarketPriceChangeColors(colorMode);
  const priceChangeColor = getMarketPriceChangeColor(livePriceChange, priceChangeColors);
  const tokenCardBackgroundColor = getValueForColorMode(TOKEN_CARD_BACKGROUND_COLORS, colorMode);
  const tokenCardBorderColor = getValueForColorMode(TOKEN_CARD_BORDER_COLORS, colorMode);
  const leverageBadgeBorderColor = getValueForColorMode(LEVERAGE_BADGE_BORDER_COLORS, colorMode);
  const leverageBadgeShadowOpacity = getValueForColorMode(LEVERAGE_BADGE_SHADOW_OPACITIES, colorMode);
  const leverageBadgeTextColor = useMemo(() => getHighContrastTextColorWorklet(item.accentColor, 4), [item.accentColor]);
  const gradientColors = isDarkMode
    ? ([opacity(item.accentColor, 0.16), opacity(item.accentColor, 0)] as const)
    : (['rgba(131, 142, 153, 0.06)', 'rgba(131, 142, 153, 0)'] as const);
  const openMarketDetails = useMarketCardPress({ metadata: item.pressMetadata, onPress: item.onNavigate, trackPress });

  return (
    <ButtonPressAnimation onPress={openMarketDetails} scaleTo={0.96}>
      <Box
        borderColor={{ custom: tokenCardBorderColor }}
        borderRadius={24}
        borderWidth={isDarkMode ? 1 : 2}
        padding="12px"
        paddingRight={{ custom: 18 }}
        backgroundColor={tokenCardBackgroundColor}
      >
        <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.contentRow}>
          {item.leverage !== undefined ? (
            <MarketIcon
              accentColor={item.accentColor}
              badgeBorderColor={leverageBadgeBorderColor}
              badgePosition="top-right"
              badgeShadowColor={isDarkMode ? '#000000' : item.accentColor}
              badgeShadowOpacity={leverageBadgeShadowOpacity}
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
                  arrowWidth={UP_DOWN_ARROW_WIDTH}
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
                color={priceChangeColor}
                height={TOKEN_SPARKLINE_LAYOUT.height}
                maxPoints={item.chartMaxPoints}
                store={item.chartStore}
                width={TOKEN_SPARKLINE_LAYOUT.width}
              />
            </View>
          </View>
        </View>
      </Box>
    </ButtonPressAnimation>
  );
}

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
