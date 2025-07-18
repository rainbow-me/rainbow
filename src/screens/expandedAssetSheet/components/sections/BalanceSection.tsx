import React from 'react';
import * as i18n from '@/languages';
import { Bleed, Box, Text, TextShadow } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { SheetSeparator } from '../shared/Separator';
import Animated from 'react-native-reanimated';
import { LAYOUT_ANIMATION } from '../shared/CollapsibleSection';

export function BalanceSection() {
  const { accentColors, accountAsset: asset, isOwnedAsset } = useExpandedAssetSheetContext();

  if (!isOwnedAsset || !asset?.balance || !asset?.native?.balance) return null;

  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <Box
        backgroundColor={accentColors.opacity6}
        borderColor={{ custom: accentColors.opacity6 }}
        borderRadius={20}
        borderWidth={1}
        gap={12}
        padding="16px"
      >
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="labelTertiary" size="15pt" weight="bold">
            {i18n.t(i18n.l.expanded_state.asset.balance)}
          </Text>
          <Text color="labelTertiary" size="15pt" weight="bold" align="right">
            {i18n.t(i18n.l.expanded_state.asset.value)}
          </Text>
        </Box>
        <Box alignItems="center" width="full" gap={8} flexDirection="row" justifyContent="flex-start">
          <Bleed vertical="4px">
            <RainbowCoinIcon
              size={20}
              chainId={asset.chainId}
              color={asset.color}
              icon={asset.icon_url}
              showBadge={false}
              symbol={asset.symbol}
            />
          </Bleed>
          <TextShadow blur={12} containerStyle={{ flex: 1 }} shadowOpacity={0.24}>
            <Text numberOfLines={1} style={{ flex: 1 }} ellipsizeMode="tail" weight="bold" size="20pt" color={'accent'}>
              {asset.balance.display}
            </Text>
          </TextShadow>
          <Text align="right" numberOfLines={1} weight="heavy" size="20pt" color="label">
            {asset.native.balance.display}
          </Text>
        </Box>
      </Box>
      <SheetSeparator />
    </Box>
  );
}
