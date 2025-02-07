import React from 'react';
import { Box, Inline, Separator, Text, TextShadow } from '@/design-system';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { FIELD_BORDER_RADIUS } from '../constants';
import { convertAmountToPercentageDisplay } from '@/helpers/utilities';

export function AllocationBreakdown() {
  const allocationPercentages = useTokenLauncherStore(state => state.allocationPercentages());
  const accentColors = useTokenLauncherStore(state => state.accentColors);
  const tokenPrice = useTokenLauncherStore(state => state.tokenPrice());

  return (
    <Box backgroundColor={accentColors.surface} borderRadius={FIELD_BORDER_RADIUS} padding={'20px'} gap={16}>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text color="label" size="20pt" weight="heavy">
          {tokenPrice}
        </Text>
        <Text color="labelQuaternary" size="13pt" weight="bold">
          {'START PRICE'}
        </Text>
      </Box>
      <Separator color={{ custom: accentColors.border }} />
      <Inline separator={<Box height={16} width={2} backgroundColor={accentColors.border} style={{ alignSelf: 'center' }} />} wrap={false}>
        <Box gap={12} flexGrow={1} justifyContent="center" alignItems="center">
          <TextShadow color={accentColors.primary} blur={12} shadowOpacity={0.24}>
            <Text color={{ custom: accentColors.primary }} size="20pt" weight="heavy">
              {`${convertAmountToPercentageDisplay(allocationPercentages.creator, 0, 1, true)}`}
            </Text>
          </TextShadow>
          <Text color={{ custom: accentColors.primary }} size="13pt" weight="bold">
            {'My Share'}
          </Text>
        </Box>
        <Box gap={12} flexGrow={1} justifyContent="center" alignItems="center">
          <Text color="label" size="20pt" weight="heavy">
            {`${convertAmountToPercentageDisplay(allocationPercentages.airdrop, 0, 1, true)}`}
          </Text>
          <Text color="labelTertiary" size="13pt" weight="bold">
            {'Airdropping'}
          </Text>
        </Box>
      </Inline>
    </Box>
  );
}
