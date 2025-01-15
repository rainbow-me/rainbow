import React, { memo } from 'react';
import { Bleed, Box, Text, TextShadow } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';

export const BalanceSection = memo(function BalanceSection() {
  const { accentColors, accountAsset: asset } = useExpandedAssetSheetContext();
  const theme = useTheme();

  if (!asset?.balance || !asset?.native?.balance) return null;

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
      <Box alignItems="center" width="full" gap={8} flexDirection="row" justifyContent="space-between">
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
        <TextShadow containerStyle={{ flex: 1 }} blur={12} shadowOpacity={0.24}>
          <Text numberOfLines={1} ellipsizeMode="tail" weight="bold" size="20pt" color="accent">
            {asset.balance.display}
          </Text>
        </TextShadow>
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text weight="bold" size="20pt" color="label">
            {asset.native.balance.display}
          </Text>
        </TextShadow>
      </Box>
    </Box>
  );
});
