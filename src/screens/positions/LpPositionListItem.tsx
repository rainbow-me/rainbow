import React from 'react';
import { Box, Column, Columns, Inline, Stack, Text, useForegroundColor } from '@/design-system';
import { useTheme } from '@/theme';
import { add, convertAmountToPercentageDisplay, convertRawAmountToNativeDisplay, divide } from '@/helpers/utilities';
import { RainbowUnderlyingAsset } from '@/resources/defi/types';
import { useAccountSettings } from '@/hooks';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { LpRangeBadge } from './LpRangeBadge';
import { TwoCoinsIcon } from '@/components/coin-icon/TwoCoinsIcon';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';

function getRangeStatus(isConcentratedLiquidity: boolean, isOutOfRange: boolean) {
  if (!isConcentratedLiquidity) {
    return 'full_range';
  }
  return isOutOfRange ? 'out_of_range' : 'in_range';
}

type Props = {
  underlyingAssets: RainbowUnderlyingAsset[];
  isConcentratedLiquidity: boolean;
  dappVersion?: string;
};

export const LpPositionListItem: React.FC<Props> = ({ underlyingAssets, isConcentratedLiquidity, dappVersion }) => {
  const { colors } = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const theme = useTheme();

  const separatorSecondary = useForegroundColor('separatorSecondary');

  const totalDepositValue = underlyingAssets.reduce((acc, underlying) => add(acc, underlying.native.amount), '0');
  const assetAllocations = underlyingAssets.map(underlying => {
    return parseFloat(divide(underlying.native.amount, totalDepositValue));
  });

  const totalValueNative = convertRawAmountToNativeDisplay(totalDepositValue, 0, 1, nativeCurrency);

  const isOutOfRange =
    underlyingAssets.some(underlying => {
      return underlying.quantity === '0';
    }) || underlyingAssets.length === 1;

  const rangeStatus = getRangeStatus(isConcentratedLiquidity, isOutOfRange);

  return (
    <Columns space={'10px'}>
      <Column width={'content'}>
        {underlyingAssets.length === 2 && (
          <TwoCoinsIcon
            badge
            // @ts-expect-error component uses different Token entity type, but it is compatible
            under={{
              ...underlyingAssets[0].asset,
              chainId: underlyingAssets[0].asset.chain_id,
            }}
            // @ts-expect-error component uses different Token entity type, but it is compatible
            over={{
              ...underlyingAssets[1].asset,
              chainId: underlyingAssets[1].asset.chain_id,
            }}
          />
        )}
        {underlyingAssets.length === 1 && (
          <RainbowCoinIcon
            icon={underlyingAssets[0].asset.icon_url ?? undefined}
            chainId={underlyingAssets[0].asset.chain_id}
            symbol={underlyingAssets[0].asset.symbol}
            theme={theme}
            colors={underlyingAssets[0].asset.colors}
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
                    {underlyingAssets.map(underlying => underlying.asset.symbol).join(' / ')}
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
                  {`${totalValueNative.display}`}
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
                    elevation={12}
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
                    assets={underlyingAssets.map((underlying, index) => ({
                      color: underlying.asset.colors.primary ?? underlying.asset.colors.fallback ?? colors.black,
                      allocationPercentage: assetAllocations[index],
                    }))}
                  />
                </Inline>
              </Column>
              <Column width="content">
                <Text size="13pt" weight="medium" color={'labelSecondary'} align="right">
                  {assetAllocations
                    .map(allocation => `${convertAmountToPercentageDisplay(allocation * 100, 0, undefined, true)}`)
                    .join(' / ')}
                </Text>
              </Column>
            </Columns>
          </Inline>
        </Stack>
      </Box>
    </Columns>
  );
};
