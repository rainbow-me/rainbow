import React from 'react';
import { Box, Column, Columns, Inline, Stack, Text, useForegroundColor } from '@/design-system';
import { useTheme } from '@/theme';
import { convertAmountToPercentageDisplay, convertRawAmountToNativeDisplay, divide } from '@/helpers/utilities';
import { RainbowUnderlyingAsset } from '@/resources/defi/types';
import { useAccountSettings } from '@/hooks';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { LpRangeBadge } from './LpRangeBadge';
import { TwoCoinsIcon } from '@/components/coin-icon/TwoCoinsIcon';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';

function getRangeStatus(assets: RainbowUnderlyingAsset[], isConcentratedLiquidity: boolean) {
  if (!isConcentratedLiquidity) {
    return 'full_range';
  }

  const isOutOfRange =
    assets.some(asset => {
      return asset.quantity === '0';
    }) || assets.length === 1;

  return isOutOfRange ? 'out_of_range' : 'in_range';
}

type Props = {
  assets: RainbowUnderlyingAsset[];
  totalAssetsValue: string;
  isConcentratedLiquidity: boolean;
  dappVersion?: string;
};

export const LpPositionListItem: React.FC<Props> = ({ assets, totalAssetsValue, isConcentratedLiquidity, dappVersion }) => {
  const { colors } = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const totalAssetsValueNative = convertRawAmountToNativeDisplay(totalAssetsValue, 0, 1, nativeCurrency);

  const rangeStatus = getRangeStatus(assets, isConcentratedLiquidity);

  const assetAllocations = assets.map(asset => {
    // if both assets value are 0 value, return 1 for asset with non-zero quantity
    if (totalAssetsValue === '0') {
      return asset.quantity === '0' ? 0 : 1;
    }
    return parseFloat(divide(asset.native.amount, totalAssetsValue));
  });

  const allocationPercentageText = assetAllocations
    .map(allocation => `${convertAmountToPercentageDisplay(allocation * 100, 0, undefined, true)}`)
    .join(' / ');

  return (
    <Columns space={'10px'}>
      <Column width={'content'}>
        {assets.length === 2 && (
          <TwoCoinsIcon
            badge
            // @ts-expect-error component uses different Token entity type, but it is compatible
            under={{
              ...assets[0].asset,
              chainId: assets[0].asset.chain_id,
            }}
            // @ts-expect-error component uses different Token entity type, but it is compatible
            over={{
              ...assets[1].asset,
              chainId: assets[1].asset.chain_id,
            }}
          />
        )}
        {assets.length === 1 && (
          <RainbowCoinIcon
            chainId={assets[0].asset.chain_id}
            color={assets[0].asset.colors?.primary || assets[0].asset.colors?.fallback || undefined}
            icon={assets[0].asset.icon_url ?? undefined}
            symbol={assets[0].asset.symbol}
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
                    {assets.map(underlying => underlying.asset.symbol).join(' / ')}
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
                  {`${totalAssetsValueNative.display}`}
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
                  <LpRangeBadge
                    assets={assets
                      .filter(asset => asset.quantity !== '0')
                      .map((underlying, index) => ({
                        id: underlying.asset.asset_code,
                        color: underlying.asset.colors?.primary ?? underlying.asset.colors?.fallback ?? colors.black,
                        allocationPercentage: assetAllocations[index],
                      }))}
                  />
                </Inline>
              </Column>
              <Column width="content">
                <Text size="13pt" weight="medium" color={'labelSecondary'} align="right">
                  {allocationPercentageText}
                </Text>
              </Column>
            </Columns>
          </Inline>
        </Stack>
      </Box>
    </Columns>
  );
};
