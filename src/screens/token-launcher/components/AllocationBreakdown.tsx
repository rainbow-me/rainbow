import React from 'react';
import i18n from '@/languages';
import { Box, Inline, Separator, Text, TextShadow } from '@/design-system';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { FIELD_BORDER_RADIUS } from '../constants';
import { convertAmountToPercentageDisplay } from '@/helpers/utilities';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';

export function AllocationBreakdown() {
  const { accentColors } = useTokenLauncherContext();

  const allocationBips = useTokenLauncherStore(state => state.allocationBips());
  const tokenPrice = useTokenLauncherStore(state => state.tokenPrice());
  const isAirdropping = allocationBips.airdrop > 0;

  return (
    <Box backgroundColor={accentColors.opacity4} borderRadius={FIELD_BORDER_RADIUS} padding={'20px'} gap={16}>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text color="label" size="20pt" weight="heavy">
          {tokenPrice}
        </Text>
        <Text color="labelQuaternary" size="13pt" weight="bold">
          {i18n.token_launcher.allocation_breakdown.start_price()}
        </Text>
      </Box>
      <Separator color={'separatorSecondary'} />
      <Inline
        separator={
          <Box height={16} style={{ alignSelf: 'center' }}>
            <Separator direction="vertical" color={'separatorSecondary'} />
          </Box>
        }
        wrap={false}
      >
        <Box gap={12} width={'1/2'} justifyContent="center" alignItems="center">
          <TextShadow color={accentColors.opacity100} blur={12} shadowOpacity={0.24}>
            <Text tabularNumbers color={{ custom: accentColors.opacity100 }} size="20pt" weight="heavy">
              {`${convertAmountToPercentageDisplay(allocationBips.creator / 100, 2, 2, false)}`}
            </Text>
          </TextShadow>
          <Text color={{ custom: accentColors.opacity100 }} size="13pt" weight="bold">
            {i18n.token_launcher.allocation_breakdown.my_share()}
          </Text>
        </Box>
        <Box gap={12} width={'1/2'} justifyContent="center" alignItems="center">
          <Text tabularNumbers color={isAirdropping ? 'label' : 'labelQuaternary'} size="20pt" weight="heavy">
            {`${convertAmountToPercentageDisplay(allocationBips.airdrop / 100, 2, 2, !isAirdropping)}`}
          </Text>
          <Text color={isAirdropping ? 'label' : 'labelQuaternary'} size="13pt" weight="bold">
            {i18n.token_launcher.allocation_breakdown.airdropping()}
          </Text>
        </Box>
      </Inline>
    </Box>
  );
}
