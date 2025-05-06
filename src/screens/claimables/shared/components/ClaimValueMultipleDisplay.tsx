import React from 'react';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { Box, globalColors, Text, TextShadow, useColorMode } from '@/design-system';
import { StyleSheet } from 'react-native';
import { Claimable } from '@/resources/addys/claimables/types';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { useAccountSettings } from '@/hooks';
import { PANEL_WIDTH } from '@/components/SmoothPager/ListPanel';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';

export function ClaimValueMultipleDisplay({ totalCurrencyValue, assets }: { totalCurrencyValue: string; assets: Claimable['assets'] }) {
  const { nativeCurrency } = useAccountSettings();
  const { isDarkMode } = useColorMode();

  const color = !isDarkMode ? '#09111F' : globalColors.white100;

  const areAllRowsHighlighted = assets.length <= 2;

  return (
    <Box alignItems="center" gap={32}>
      <Box alignItems="center" flexDirection="row" gap={8} justifyContent="center">
        <TextShadow blur={12} color={globalColors.grey100} shadowOpacity={0.1} y={4}>
          <Text align="center" color="label" size="44pt" weight="black">
            {totalCurrencyValue}
          </Text>
        </TextShadow>
      </Box>
      <Box width={PANEL_WIDTH - 28 - 24} flexDirection="column" gap={4} paddingHorizontal="8px">
        {assets.map((asset, index) => {
          const isHighlighted = index % 2 !== 0 || areAllRowsHighlighted;
          return (
            <Box
              style={[
                styles.row,
                {
                  backgroundColor: isHighlighted ? opacity(color, 0.025) : 'transparent',
                  borderColor: isHighlighted ? opacity(color, 0.01) : 'transparent',
                },
              ]}
              key={asset.asset.uniqueId}
            >
              <Box gap={12} flexDirection="row" alignItems="center">
                <RainbowCoinIcon icon={asset.asset.icon_url} size={24} chainId={asset.asset.chainId} symbol={asset.asset.symbol} />
                <Text align="center" color="label" size="17pt" weight="semibold">
                  {asset.amount.display}
                </Text>
              </Box>
              <Text align="center" color="label" size="17pt" weight="bold">
                {convertAmountToNativeDisplayWorklet(asset.usd_value, nativeCurrency)}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 14,
    padding: 12,
    paddingLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: THICK_BORDER_WIDTH,
  },
});
