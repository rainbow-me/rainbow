import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Box, Text, TextIcon, useColorMode } from '@/design-system';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { useTokensPlacementStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { opacity } from '@/framework/ui/utils/opacity';
import { formatCurrency, formatNumber } from '@/helpers/strings';
import useColorForAsset from '@/hooks/useColorForAsset';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import type { FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { getUniqueId } from '@/utils/ethereumUtils';

const INITIAL_VISIBLE_TOKEN_COUNT = 5;

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
  const { isDarkMode } = useColorMode();
  const assetAccentColor = useColorForAsset({
    address: asset.address,
    name: asset.name,
    symbol: asset.symbol,
  });

  const initialPrice = asset.price.value ? String(asset.price.value) : '0';
  const initialPriceChange = asset.price.relativeChange24h ? String(asset.price.relativeChange24h) : '0';
  const tokenId = getUniqueId(asset.address, asset.chainId);

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
                initialValue={formatPriceChange(initialPriceChange)}
                selector={token => formatPriceChange(token.change.change24hPct)}
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
    </ButtonPressAnimation>
  );
}

function ShowMoreButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={styles.showMoreButton}>
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={6} height={{ custom: 44 }}>
        <Text size="17pt" weight="heavy" color="label">
          {`Show ${count} more`}
        </Text>
        <TextIcon size="icon 14px" weight="heavy" color="labelQuaternary">
          {'􀆈'}
        </TextIcon>
      </Box>
    </ButtonPressAnimation>
  );
}

function formatPriceChange(value: string | number | null | undefined): string {
  const numericValue = Number(value ?? 0);
  const arrow = numericValue >= 0 ? '􀄨' : '􀄩';
  return `${arrow} ${formatNumber(numericValue, { decimals: 2, useOrderSuffix: true })}%`;
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
  showMoreButton: {
    alignSelf: 'center',
  },
});
