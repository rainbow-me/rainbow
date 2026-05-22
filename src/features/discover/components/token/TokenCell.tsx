import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import { LiveTokenText, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { Box, Text, useColorMode } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { CarouselCardSkeleton } from '@/features/discover/components/carousel/CarouselCardSkeleton';
import { usePlacementCardTrackPress } from '@/features/discover/components/carousel/placementCardContext';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { buildTokenLineChartId, useTokenLineChartsStore } from '@/features/discover/stores/tokenLineChartsStore';
import { type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import { opacity } from '@/framework/ui/utils/opacity';
import { formatCurrency } from '@/helpers/strings';
import useColorForAsset from '@/hooks/useColorForAsset';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { type TokenData } from '@/state/liveTokens/liveTokensStore';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getUniqueId } from '@/utils/ethereumUtils';

const TOKEN_CARD_BORDER_RADIUS = 24;
const TOKEN_CARD_HEIGHT = 64;
const TOKEN_CARD_WIDTH = DEVICE_WIDTH - SCREEN_HORIZONTAL_PADDING * 2;
const TOKEN_SPARKLINE_MAX_POINTS = 24;
const TOKEN_SPARKLINE_LAYOUT = { height: 34, width: 64 };
const TOKEN_CARD_BACKGROUND_COLORS = {
  dark: opacity('#202429', 0.4),
  light: 'rgba(255, 255, 255, 0.92)',
};
const TOKEN_CARD_BORDER_COLORS = {
  dark: 'rgba(255, 255, 255, 0.05)',
  light: 'rgba(255, 255, 255, 0.8)',
};
const PRICE_CHANGE_COLORS = {
  dark: { positive: '#3ECF5B', negative: '#FF584D', neutral: 'rgba(255, 255, 255, 0.5)' },
  light: { positive: '#1DB847', negative: '#FA423C', neutral: 'rgba(0, 0, 0, 0.5)' },
};

export function TokenCell({ item }: { item: TokenPlacementItem }) {
  return <TokenCard asset={item.asset} itemId={item.id} />;
}

export function TokenCellSkeleton() {
  return <CarouselCardSkeleton borderRadius={TOKEN_CARD_BORDER_RADIUS} height={TOKEN_CARD_HEIGHT} width={TOKEN_CARD_WIDTH} />;
}

function TokenCard({ asset, itemId }: { asset: FormattedExternalAsset; itemId: string }) {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const { colorMode, isDarkMode } = useColorMode();
  const trackPress = usePlacementCardTrackPress();
  const assetAccentColor = useColorForAsset({
    address: asset.address,
    name: asset.name,
    symbol: asset.symbol,
  });

  const initialPrice = asset.price.value ? String(asset.price.value) : '0';
  const initialPriceChange = asset.price.relativeChange24h ? String(asset.price.relativeChange24h) : '0';
  const priceChangeColors = getValueForColorMode(PRICE_CHANGE_COLORS, colorMode);
  const tokenId = getUniqueId(asset.address, asset.chainId);
  const iconUrl = asset.iconUrl || asset.icon_url;
  const livePriceChange = useLiveTokenValue({
    initialValue: initialPriceChange,
    selector: selectLivePriceChange24h,
    tokenId,
  });
  const tokenLineChartId = buildTokenLineChartId({
    address: asset.address,
    chainId: asset.chainId,
    currency: nativeCurrency,
  });
  const roundedPriceChange = getRoundedPriceChange(livePriceChange);
  const priceChangeColor = getPriceChangeColor(roundedPriceChange, priceChangeColors);
  const tokenCardBackgroundColor = getValueForColorMode(TOKEN_CARD_BACKGROUND_COLORS, colorMode);
  const tokenCardBorderColor = getValueForColorMode(TOKEN_CARD_BORDER_COLORS, colorMode);
  const gradientColors = isDarkMode
    ? ([opacity(assetAccentColor, 0.16), opacity(assetAccentColor, 0)] as const)
    : (['rgba(131, 142, 153, 0.06)', 'rgba(131, 142, 153, 0)'] as const);

  const openTokenDetails = useCallback(() => {
    trackPress?.({
      marketId: itemId,
      marketName: asset.name,
      marketSymbol: asset.symbol,
    });
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset,
      address: asset.address,
      chainId: asset.chainId,
    });
  }, [asset, itemId, trackPress]);

  return (
    <ButtonPressAnimation onPress={openTokenDetails} scaleTo={0.96}>
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
          {iconUrl && <ImgixImage size={40} source={{ uri: iconUrl }} style={styles.icon} />}
          <View style={styles.cardBody}>
            <View style={styles.namePriceColumn}>
              <Text size="17pt" weight="heavy" color="label" numberOfLines={1}>
                {asset.name}
              </Text>
              <View style={styles.priceRow}>
                <LiveTokenText
                  tokenId={tokenId}
                  initialValueLastUpdated={asset.price.updatedAt}
                  initialValue={formatCurrency(initialPrice, { currency: nativeCurrency })}
                  selector={token => formatCurrency(token.price, { currency: nativeCurrency })}
                  color="labelSecondary"
                  numberOfLines={1}
                  size="15pt"
                  weight="bold"
                />
                <TokenPriceChange color={priceChangeColor} priceChange={roundedPriceChange} />
              </View>
            </View>
            <View style={styles.sparklineContainer}>
              <SparklineChart
                chartId={tokenLineChartId}
                color={priceChangeColor}
                height={TOKEN_SPARKLINE_LAYOUT.height}
                maxPoints={TOKEN_SPARKLINE_MAX_POINTS}
                store={useTokenLineChartsStore}
                width={TOKEN_SPARKLINE_LAYOUT.width}
              />
            </View>
          </View>
        </View>
      </Box>
    </ButtonPressAnimation>
  );
}

function TokenPriceChange({ color, priceChange }: { color: string; priceChange: number }) {
  return (
    <View style={styles.priceChangeRow}>
      <Text numberOfLines={1} size="15pt" color={{ custom: color }} weight="bold">
        {formatPriceChangeText(priceChange)}
      </Text>
    </View>
  );
}

function selectLivePriceChange24h(state: TokenData): string {
  return state.change.change24hPct;
}

function getRoundedPriceChange(value: string | number): number {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) return 0;
  return Number(numericValue.toFixed(2));
}

function formatPriceChangeText(priceChange: number): string {
  return `${Math.abs(priceChange).toFixed(2)}%`;
}

function getPriceChangeColor(priceChange: number, priceChangeColors: { negative: string; positive: string; neutral: string }): string {
  if (priceChange > 0) return priceChangeColors.positive;
  if (priceChange < 0) return priceChangeColors.negative;
  return priceChangeColors.neutral;
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
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
