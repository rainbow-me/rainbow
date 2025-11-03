import React, { useMemo } from 'react';
import { Box, Column, Columns, Inline, Stack, Text, useForegroundColor } from '@/design-system';
import { useTheme } from '@/theme';
import { RainbowUnderlyingAsset, RangeStatus, LpAllocation } from '@/features/positions/types';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { LpPositionRangeBadge } from './LpPositionRangeBadge';
import { TwoCoinsIcon } from '@/components/coin-icon/TwoCoinsIcon';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { ButtonPressAnimation } from '@/components/animations';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

type LpPositionListItemProps = {
  assets: RainbowUnderlyingAsset[];
  value: { amount: string; display: string };
  rangeStatus: RangeStatus;
  allocation: LpAllocation;
  dappVersion?: string;
  name?: string;
  onPress?: (asset: RainbowUnderlyingAsset['asset']) => void;
};

export const LpPositionListItem = React.memo(function LpPositionListItem({
  assets,
  value,
  rangeStatus,
  allocation,
  dappVersion,
  name,
  onPress,
}: LpPositionListItemProps) {
  const { colors } = useTheme();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const chainsNativeAsset = useBackendNetworksStore(state => state.getChainsNativeAsset());

  const { displayAssets, orderedAssets } = useMemo(() => {
    // For pools with >2 assets, show first 2 + "Other"
    const orderedAssets = assets.length > 2 ? assets.slice(0, 2) : assets;
    let displayAssets = orderedAssets;

    // If native/wrapped asset comes first, flip the order so non-native token is displayed first
    if (allocation.splits === 2) {
      const firstSymbol = displayAssets[0].asset.symbol?.toLowerCase();
      const nativeAsset = chainsNativeAsset[displayAssets[0].asset.chainId];
      const nativeSymbol = nativeAsset?.symbol?.toLowerCase();

      if (firstSymbol && nativeSymbol && (firstSymbol === nativeSymbol || firstSymbol === `w${nativeSymbol}`)) {
        displayAssets = [displayAssets[1], displayAssets[0]];
      }
    }
    return { displayAssets, orderedAssets };
  }, [assets, allocation.splits, chainsNativeAsset]);

  const rangeBadgeAssets = useMemo(
    () =>
      assets
        .filter(asset => asset.quantity !== '0')
        .map((underlying, index) => {
          return {
            id: underlying.asset.address,
            color: underlying.asset.colors?.primary ?? underlying.asset.colors?.fallback ?? colors.black,
            allocationPercentage: allocation.percentages[index] || 0,
          };
        }),
    [assets, allocation, colors]
  );

  const renderContent = () => (
    <Columns space={'10px'}>
      <Column width={'content'}>
        {displayAssets.length >= 2 && (
          <TwoCoinsIcon
            badge={displayAssets[0].asset.chainId !== ChainId.mainnet}
            over={displayAssets[0].asset}
            under={displayAssets[1].asset}
          />
        )}
        {displayAssets.length === 1 && (
          <RainbowCoinIcon
            chainId={displayAssets[0].asset.chainId}
            color={displayAssets[0].asset.colors?.primary || displayAssets[0].asset.colors?.fallback || undefined}
            icon={displayAssets[0].asset.icon_url}
            symbol={displayAssets[0].asset.symbol}
          />
        )}
        {/* TODO: add three+ coins icon */}
      </Column>
      <Box justifyContent="center" style={{ height: 40 }}>
        <Stack space="10px">
          <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
            <Columns alignVertical="center">
              <Column>
                <Inline alignVertical="center" space={'6px'}>
                  <Text size="17pt" weight="medium" color="label" numberOfLines={1}>
                    {/* Keep asset symbols in the expected pool order for display */}
                    {`${orderedAssets.map(underlying => underlying.asset.symbol).join(' / ')}${
                      allocation.splits > 2 ? ` / ${i18n.t(i18n.l.positions.lp_allocation.other)}` : ''
                    }${name ? ` for ${name}` : ''}`}
                  </Text>
                  {dappVersion && (
                    <Box
                      borderRadius={7}
                      padding={{ custom: 4.5 }}
                      style={{
                        borderColor: separatorSecondary,
                        borderWidth: 1.5,
                        // offset vertical padding
                        marginVertical: -11,
                      }}
                    >
                      <Text color="labelQuaternary" size="13pt" weight="bold">
                        {dappVersion}
                      </Text>
                    </Box>
                  )}
                </Inline>
              </Column>
              <Column width={'content'}>
                <Text size="17pt" weight="medium" color="label" numberOfLines={1}>
                  {value.display}
                </Text>
              </Column>
            </Columns>
          </Inline>
          <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
            <Columns alignVertical="center">
              <Column>
                <Inline alignVertical="center" space={'6px'}>
                  <Box
                    width={{ custom: 7 }}
                    height={{ custom: 7 }}
                    borderRadius={7 / 2}
                    borderWidth={1}
                    borderColor={{ custom: 'rgba(0,0,0,0.02)' }}
                    backgroundColor={rangeStatus === 'in_range' || rangeStatus === 'full_range' ? colors.green : colors.red}
                    shadowColor={rangeStatus === 'in_range' || rangeStatus === 'full_range' ? colors.green : colors.red}
                    elevation={2}
                    shadowOpacity={IS_IOS ? 0.2 : 1}
                    shadowRadius={6}
                    style={{
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  />
                  <Box style={{ maxWidth: 150 }}>
                    <Text size="13pt" weight="semibold" color="labelTertiary" numberOfLines={1}>
                      {i18n.t(i18n.l.positions.lp_range_status[rangeStatus])}
                    </Text>
                  </Box>
                  <LpPositionRangeBadge assets={rangeBadgeAssets} />
                </Inline>
              </Column>
              <Column width="content">
                <Text size="13pt" weight="medium" color={'labelSecondary'} align="right">
                  {allocation.display}
                </Text>
              </Column>
            </Columns>
          </Inline>
        </Stack>
      </Box>
    </Columns>
  );

  return onPress ? (
    <ButtonPressAnimation onPress={() => onPress(displayAssets[0].asset)}>{renderContent()}</ButtonPressAnimation>
  ) : (
    renderContent()
  );
});
