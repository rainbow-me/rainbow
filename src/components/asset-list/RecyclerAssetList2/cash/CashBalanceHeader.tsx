import React, { memo } from 'react';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { CashBalanceHeaderHeight } from '@/components/asset-list/RecyclerAssetList2/core/ViewDimensions';
import { Box, Inline, Stack, Text } from '@/design-system';
import { CashBalanceGradientButton } from '@/features/cash-balance/components/CashBalanceGradientButton';
import { CashBalanceIcon } from '@/features/cash-balance/components/CashBalanceIcon';
import { useCashBalance } from '@/features/cash-balance/hooks/useCashBalance';
import { useCashBalanceAddPress } from '@/features/cash-balance/hooks/useCashBalanceAddPress';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

const ADD_BUTTON_HEIGHT = 36;

export const CashBalanceHeader = memo(function CashBalanceHeader() {
  const { balanceDisplay } = useCashBalance();
  const handleAddPress = useCashBalanceAddPress('cash balance widget');
  const handleRowPress = () => Navigation.handleAction(Routes.CASH_BALANCE_HALF_SHEET);

  return (
    <Box paddingHorizontal="12px" justifyContent="center" height={{ custom: CashBalanceHeaderHeight }}>
      <ButtonPressAnimation onPress={handleRowPress} scaleTo={0.98} testID="cash-balance-header-row-button">
        <Box
          background="surfaceSecondaryElevated"
          borderRadius={32}
          height={{ custom: CashBalanceHeaderHeight - 8 }}
          paddingLeft="8px"
          paddingRight="16px"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          shadow="12px"
          testID="cash-balance-header"
        >
          <Inline alignVertical="center" horizontalSpace="12px" wrap={false}>
            <CashBalanceIcon />
            <Stack space="12px">
              <Text color="labelQuaternary" size="15pt" weight="semibold">
                {i18n.t(i18n.l.account.tab_cash)}
              </Text>
              <Text color="label" size="17pt" weight="bold">
                {balanceDisplay}
              </Text>
            </Stack>
          </Inline>
        </Box>
      </ButtonPressAnimation>

      {/* A true sibling of the row's ButtonPressAnimation, not a descendant — nesting one native
          button inside another leaves the outer one owning all touches within its bounds on
          Android, silently swallowing the inner button's presses (see RnbwFeatureCard's
          DismissButton for the same fix: an absolutely-positioned sibling, not a nested button). */}
      {/* right accounts for both this row's own 12px horizontal padding and the pill's 16px
          paddingRight, since an absolutely positioned child ignores its parent's padding. */}
      <Box position="absolute" right={{ custom: 12 + 16 }} top={{ custom: (CashBalanceHeaderHeight - ADD_BUTTON_HEIGHT) / 2 }}>
        <CashBalanceGradientButton
          height={ADD_BUTTON_HEIGHT}
          onPress={handleAddPress}
          paddingHorizontal="12px"
          testID="cash-balance-header-add-button"
        >
          <Text color="white" size="17pt" weight="heavy">
            {i18n.t(i18n.l.button.add)}
          </Text>
        </CashBalanceGradientButton>
      </Box>
    </Box>
  );
});
