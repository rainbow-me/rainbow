import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { ImgixImage } from '@/components/images';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Box, Text, useColorMode } from '@/design-system';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { useTokensPlacementStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { opacity } from '@/framework/ui/utils/opacity';
import { formatCurrency, formatNumber } from '@/helpers/strings';
import useColorForAsset from '@/hooks/useColorForAsset';
import type { FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { getUniqueId } from '@/utils/ethereumUtils';

/**
 * TODO: Add skeleton state, navigation to asset sheet, spark line chart, and press tracking
 */
export function TokenList() {
  const { isLoading, items, placement } = useTokensPlacementStore();
  return (
    <Box gap={8} paddingHorizontal={{ custom: SCREEN_HORIZONTAL_PADDING }}>
      {items.map(item => (
        <TokenCard key={item.ref.id} asset={item.asset} />
      ))}
    </Box>
  );
}

function TokenCard({ asset }: { asset: FormattedExternalAsset }) {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const { isDarkMode } = useColorMode();
  const assetAccentColor = useColorForAsset({
    address: asset.address,
    name: asset.name,
    symbol: asset.symbol,
  });

  const initialPrice = asset.price.value ? String(asset.price.value) : '0';
  const initialPriceChange = asset.price.relativeChange24h ? String(asset.price.relativeChange24h) : '0';
  const tokenId = getUniqueId(asset.address, asset.chainId);

  return (
    <Box
      borderColor={{ custom: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
      borderRadius={24}
      padding="12px"
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
        <View style={styles.namePriceColumn}>
          <Text size="17pt" weight="heavy" color="label">
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
            <LiveTokenText
              tokenId={tokenId}
              initialValue={`${formatNumber(initialPriceChange, { decimals: 2, useOrderSuffix: true })}%`}
              selector={token => `${formatNumber(token.change.change24hPct, { decimals: 2, useOrderSuffix: true })}%`}
              color="label"
              numberOfLines={1}
              size="15pt"
              weight="bold"
              isPriceChangeColorEnabled
            />
          </View>
        </View>
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  namePriceColumn: {
    alignItems: 'flex-start',
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 40 / 2,
  },
});
