import React, { useCallback } from 'react';
import * as i18n from '@/languages';
import { Box, Text } from '@/design-system';
import { PrebuySection } from './PrebuySection';
import { AllocationBreakdown } from './AllocationBreakdown';
import { AirdropSection } from './AirdropSection';
import { ButtonPressAnimation } from '@/components/animations';
import { Keyboard } from 'react-native';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { convertAmountToPercentageDisplay } from '@/helpers/utilities';

function TokenAllocationInfoButton() {
  const { navigate } = useNavigation();

  const allocationBips = useTokenLauncherStore(state => state.allocationBips());

  const showTokenAllocationInfo = useCallback(async () => {
    Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'token_allocation',
      sections: [
        {
          title: i18n.t(i18n.l.token_launcher.allocation_breakdown.sections.my_share.title),
          description: i18n.t(i18n.l.token_launcher.allocation_breakdown.sections.my_share.description),
          value: convertAmountToPercentageDisplay(allocationBips.creator / 100, 2, 2, false),
        },
        {
          title: i18n.t(i18n.l.token_launcher.allocation_breakdown.sections.airdropping.title),
          description: i18n.t(i18n.l.token_launcher.allocation_breakdown.sections.airdropping.description),
          value: convertAmountToPercentageDisplay(allocationBips.airdrop / 100, 2, 2, false),
        },
        {
          title: i18n.t(i18n.l.token_launcher.allocation_breakdown.sections.liquidity_pool.title),
          description: i18n.t(i18n.l.token_launcher.allocation_breakdown.sections.liquidity_pool.description),
          value: convertAmountToPercentageDisplay(allocationBips.lp / 100, 2, 2, false),
        },
        {
          title: i18n.t(i18n.l.token_launcher.allocation_breakdown.sections.rainbow_share.title),
          description: i18n.t(i18n.l.token_launcher.allocation_breakdown.sections.rainbow_share.description),
          value: convertAmountToPercentageDisplay(5, 2, 2, false),
        },
      ],
    });
  }, [navigate, allocationBips]);

  return (
    <ButtonPressAnimation onPress={showTokenAllocationInfo}>
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={4} hitSlop={12}>
        <Text color="labelQuaternary" size="icon 13px" weight="heavy">
          􀅴
        </Text>
        <Text color="labelQuaternary" uppercase size="13pt" weight="heavy">
          {i18n.t(i18n.l.token_launcher.buttons.token_allocation_info)}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}

export function TokenAllocationSection() {
  return (
    <Box gap={16} paddingVertical={'20px'} width="full">
      <Box paddingHorizontal={'20px'} flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text color="labelQuaternary" size="13pt" weight="heavy">
          {i18n.t(i18n.l.token_launcher.titles.token_allocation)}
        </Text>

        <TokenAllocationInfoButton />
      </Box>
      <Box gap={12} width={'full'}>
        <AllocationBreakdown />
        <PrebuySection />
        <AirdropSection />
      </Box>
    </Box>
  );
}
