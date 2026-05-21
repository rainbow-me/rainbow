import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import { LiveTokenText, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { Box, Text, TextIcon, useColorMode } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { buildTokenLineChartId, useTokenLineChartsStore } from '@/features/discover/stores/tokenLineChartsStore';
import { useTokensPlacementStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { opacity } from '@/framework/ui/utils/opacity';
import { formatCurrency } from '@/helpers/strings';
import useColorForAsset from '@/hooks/useColorForAsset';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import type { FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { type TokenData } from '@/state/liveTokens/liveTokensStore';
import { getUniqueId } from '@/utils/ethereumUtils';

const INITIAL_VISIBLE_TOKEN_COUNT = 5;
const TOKEN_SPARKLINE_LAYOUT = { height: 34, width: 64 };
const PRICE_CHANGE_COLORS = {
  dark: { positive: '#3ECF5B', negative: '#FF584D', neutral: 'rgba(255, 255, 255, 0.5)' },
  light: { positive: '#1DB847', negative: '#FA423C', neutral: 'rgba(0, 0, 0, 0.5)' },
};

export function TokenList() {
  const { items } = useTokensPlacementStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = isExpanded ? items : items.slice(0, INITIAL_VISIBLE_TOKEN_COUNT);
  const remainingTokenCount = items.length - visibleItems.length;

  return (
    <Box gap={8} paddingHorizontal={{ custom: SCREEN_HORIZONTAL_PADDING }}>
      {visibleItems.map(item => (
        <TokenCard key={item.ref.id} asset={item.asset} />
      ))}
      {remainingTokenCount > 0 && <ShowMoreButton count={remainingTokenCount} onPress={() => setIsExpanded(true)} />}
    </Box>
  );
}

function TokenCard({ asset }: { asset: FormattedExternalAsset }) {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const { colorMode, isDarkMode } = useColorMode();
  const assetAccentColor = useColorForAsset({
    address: asset.address,
    name: asset.name,
    symbol: asset.symbol,
  });

  const initialPrice = asset.price.value ? String(asset.price.value) : '0';
  const initialPriceChange = asset.price.relativeChange24h ? String(asset.price.relativeChange24h) : '0';
  const priceChangeColors = getValueForColorMode(PRICE_CHANGE_COLORS, colorMode);
  const tokenId = getUniqueId(asset.address, asset.chainId);
  const livePriceChange = useLiveTokenValue({
    initialValue: initialPriceChange,
    selector: selectLivePriceChange24h,
    tokenId,
  });
  const tokenLineChartId = buildTokenLineChartId({ address: asset.address, chainId: asset.chainId, currency: nativeCurrency });
  const roundedPriceChange = getRoundedPriceChange(livePriceChange);
  const priceChangeColor = getPriceChangeColor(roundedPriceChange, priceChangeColors);

  const openTokenDetails = useCallback(() => {
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset,
      address: asset.address,
      chainId: asset.chainId,
    });
  }, [asset]);

  return (
    <ButtonPressAnimation onPress={openTokenDetails} scaleTo={0.96}>
      <Box
        borderColor={{ custom: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
        borderRadius={24}
        padding="12px"
        paddingRight={{ custom: 18 }}
        backgroundColor={opacity('#202429', 0.4)}
      >
        <LinearGradient
          colors={[opacity(assetAccentColor, 0.16), opacity(assetAccentColor, 0)]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.contentRow}>
          {asset.iconUrl && <ImgixImage size={40} source={{ uri: asset.iconUrl }} style={styles.icon} />}
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

function ShowMoreButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={styles.showMoreButton}>
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={6} height={{ custom: 44 }}>
        <Text size="17pt" weight="heavy" color="label">
          {getShowMoreLabel(count)}
        </Text>
        <TextIcon size="icon 14px" weight="heavy" color="labelQuaternary">
          {'􀆈'}
        </TextIcon>
      </Box>
    </ButtonPressAnimation>
  );
}

function getShowMoreLabel(count: number): string {
  return count === 2 ? 'Show 2 more' : 'Show more';
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
  showMoreButton: {
    alignSelf: 'center',
  },
});
