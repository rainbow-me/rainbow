import React, { memo } from 'react';

import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Text } from '@/design-system';
import { CashBalanceIcon } from '@/features/cash-balance/components/CashBalanceIcon';
import * as i18n from '@/languages';

// Stacked on top of CashBalanceHalfSheet when Withdraw is pressed, matching the Figma mini
// sheet. A real route (rather than an inline overlay) so it gets its own independent native
// dismiss gesture instead of dragging the half sheet underneath it along with it.
export const CashBalanceWithdrawComingSoonSheet = memo(function CashBalanceWithdrawComingSoonSheet() {
  return (
    <PanelSheet>
      <Box paddingBottom="32px" paddingHorizontal="32px" paddingTop="52px">
        <CashBalanceIcon size={52} />
        <Box paddingTop="16px">
          <Text color="label" size="26pt" weight="heavy">
            {i18n.t(i18n.l.cash_balance.half_sheet.withdraw_coming_soon)}
          </Text>
        </Box>
      </Box>
    </PanelSheet>
  );
});
