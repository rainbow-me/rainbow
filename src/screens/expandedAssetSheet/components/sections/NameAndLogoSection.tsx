import React, { memo } from 'react';

import Animated, { FadeIn } from 'react-native-reanimated';

import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { RainbowCoinEffect } from '@/components/rainbow-coin-effect/RainbowCoinEffect';
import { Box, Text, TextShadow, useColorMode } from '@/design-system';
import { RAINBOW_COIN_EFFECT } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';

import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { AssetContextMenu } from '../AssetContextMenu';

const PILL_ENTERING = FadeIn.duration(160);

export const NameAndLogoSection = memo(function NameAndLogoSection() {
  const { basicAsset: asset, isRainbowToken, accentColors, assetClassification } = useExpandedAssetSheetContext();
  const shouldUseRainbowCoinEffect = useExperimentalFlag(RAINBOW_COIN_EFFECT);
  const { isDarkMode } = useColorMode();
  const name = assetClassification?.header?.name ?? asset.name;
  const iconUrl = assetClassification?.header?.iconUrl ?? asset.iconUrl;

  return (
    <Box gap={20}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between">
        {(isRainbowToken || shouldUseRainbowCoinEffect) && iconUrl ? (
          <RainbowCoinEffect color={accentColors.color} imageUrl={iconUrl} size={44} />
        ) : (
          <RainbowCoinIcon
            chainSize={20}
            size={44}
            icon={iconUrl ?? ''}
            chainId={asset.chainId}
            color={accentColors.color}
            symbol={asset.symbol}
          />
        )}
        <AssetContextMenu />
      </Box>
      <Box alignItems="center" flexDirection="row" gap={8}>
        <Box flexShrink={1}>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text
              color={{ custom: accentColors.color }}
              numberOfLines={2}
              size="22pt"
              testID={`chart-header-${asset.name}`}
              weight={'heavy'}
            >
              {name}
            </Text>
          </TextShadow>
        </Box>
        {assetClassification && (
          <Animated.View entering={PILL_ENTERING}>
            <Box
              paddingHorizontal="6px"
              height={24}
              justifyContent="center"
              alignItems="center"
              borderRadius={10}
              borderWidth={5 / 3}
              backgroundColor={accentColors.opacity6}
              borderColor={{ custom: accentColors.opacity6 }}
            >
              <Text align="center" color={{ custom: isDarkMode ? accentColors.opacity56 : accentColors.color }} size="15pt" weight="heavy">
                {assetClassification.label}
              </Text>
            </Box>
          </Animated.View>
        )}
      </Box>
    </Box>
  );
});
