import React, { memo } from 'react';
import { Bleed, Box, Inline, Text, TextShadow } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';

export const BalanceSection = memo(function BalanceSection() {
  const { accentColors, asset } = useExpandedAssetSheetContext();
  const theme = useTheme();

  if (!asset.balance || !asset.native?.balance) return null;

  return (
    <Box
      padding="16px"
      borderRadius={20}
      style={{ backgroundColor: accentColors.opacity6, borderColor: accentColors.opacity6, borderWidth: 1 }}
      gap={12}
    >
      <Box flexDirection="row" justifyContent="space-between">
        <Text color="labelTertiary" size="15pt" weight="bold">
          Balance
        </Text>
        <Text color="labelTertiary" size="15pt" weight="bold" align="right">
          Value
        </Text>
      </Box>
      <Box flexDirection="row" justifyContent="space-between">
        <Inline space="8px" alignVertical="center">
          <Bleed vertical="3px">
            <RainbowCoinIcon
              size={20}
              chainId={asset.chainId}
              colors={asset.colors}
              icon={asset.icon_url}
              ignoreBadge
              symbol={asset.symbol}
              theme={theme}
            />
          </Bleed>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text weight="bold" size="20pt" color="accent">
              {asset.balance.display}
            </Text>
          </TextShadow>
        </Inline>
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text weight="bold" size="20pt" color="label">
            {asset.native.balance.display}
          </Text>
        </TextShadow>
      </Box>
    </Box>
  );
});
