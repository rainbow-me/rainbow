import React, { memo } from 'react';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { Box, Text, TextShadow } from '@/design-system';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { RainbowCoinEffect } from '@/components/rainbow-coin-effect/RainbowCoinEffect';
import { RAINBOW_COIN_EFFECT } from '@/config/experimental';
import { useExperimentalFlag } from '@/config';

export const NameAndLogoSection = memo(function NameAndLogoSection() {
  const { basicAsset: asset, isRainbowToken, accentColors } = useExpandedAssetSheetContext();
  const shouldUseRainbowCoinEffect = useExperimentalFlag(RAINBOW_COIN_EFFECT);

  return (
    <Box gap={20}>
      {(isRainbowToken || shouldUseRainbowCoinEffect) && asset.iconUrl ? (
        <RainbowCoinEffect color={accentColors.color} imageUrl={asset.iconUrl} size={44} />
      ) : (
        <RainbowCoinIcon
          chainSize={20}
          size={44}
          icon={asset.iconUrl ?? ''}
          chainId={asset.chainId}
          color={accentColors.color}
          symbol={asset.symbol}
        />
      )}
      <TextShadow blur={12} shadowOpacity={0.24}>
        <Text color={{ custom: accentColors.color }} numberOfLines={2} size="22pt" testID={`chart-header-${asset.name}`} weight={'heavy'}>
          {asset.name}
        </Text>
      </TextShadow>
    </Box>
  );
});
