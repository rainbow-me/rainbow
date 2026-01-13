import React, { memo } from 'react';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { Box } from '@/design-system/components/Box/Box';
import { Inline } from '@/design-system/components/Inline/Inline';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { opacity } from '@/__swaps__/utils/swaps';

// ============ Types ========================================================= //

type ChainSelectorButtonProps = {
  accentColor: string;
  chainId: ChainId;
  disabled?: boolean;
  onPress: () => void;
};

// ============ Constants ===================================================== //

const BORDER_WIDTH = 2.5;

// ============ Component ===================================================== //

export const ChainSelectorButton = memo(function ChainSelectorButton({
  accentColor,
  chainId,
  disabled = false,
  onPress,
}: ChainSelectorButtonProps) {
  const networkLabel = useBackendNetworksStore.getState().getChainsLabel()[chainId];

  return (
    <ButtonPressAnimation disabled={disabled} onPress={onPress} scaleTo={0.9}>
      <Box
        alignItems="center"
        backgroundColor={opacity(accentColor, 0.1)}
        borderColor={{ custom: opacity(accentColor, 0.06) }}
        borderRadius={16}
        borderWidth={BORDER_WIDTH}
        flexDirection="row"
        gap={8}
        paddingLeft="10px"
        paddingRight="12px"
        paddingVertical="8px"
      >
        <ChainImage chainId={chainId} position="relative" size={24} />
        <Inline alignVertical="center" space="6px">
          <Text color="label" numberOfLines={1} size="17pt" weight="heavy">
            {networkLabel}
          </Text>
          <TextIcon color={{ custom: accentColor }} size="icon 15px" textStyle={{ top: 1 }} weight="heavy" width={16}>
            {'􀆈'}
          </TextIcon>
        </Inline>
      </Box>
    </ButtonPressAnimation>
  );
});
