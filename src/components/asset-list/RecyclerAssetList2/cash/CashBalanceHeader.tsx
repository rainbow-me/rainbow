import React, { memo, useCallback } from 'react';

import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { CashBalanceHeaderHeight } from '@/components/asset-list/RecyclerAssetList2/core/ViewDimensions';
import { Box, Inline, Stack, Text } from '@/design-system';
import { CashBalanceIcon } from '@/features/cash-balance/components/CashBalanceIcon';
import { CASH_BALANCE_COLORS } from '@/features/cash-balance/constants';
import { useCashBalance } from '@/features/cash-balance/hooks/useCashBalance';
import { useAddCashRoute } from '@/features/cash/navigation/useAddCashRoute';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { getIsDamagedWallet } from '@/state/wallets/walletsStore';

const ADD_BUTTON_HEIGHT = 36;

export const CashBalanceHeader = memo(function CashBalanceHeader() {
  const { balanceDisplay } = useCashBalance();
  const navigate = useNavigationForNonReadOnlyWallets();
  const { name: routeName } = useRoute();
  const { route: addCashRoute } = useAddCashRoute();

  const handleAddPress = useCallback(() => {
    if (getIsDamagedWallet()) {
      navigate(Routes.WALLET_ERROR_SHEET);
      return;
    }
    navigate(addCashRoute);
  }, [addCashRoute, navigate]);

  return (
    <Box paddingHorizontal="12px" justifyContent="center" height={{ custom: CashBalanceHeaderHeight }}>
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
        testID={`cash-balance-header-${routeName}`}
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

        <ButtonPressAnimation onPress={handleAddPress} scaleTo={0.94} testID="cash-balance-header-add-button">
          <Box
            as={LinearGradient}
            colors={CASH_BALANCE_COLORS.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.75, y: 1 }}
            alignItems="center"
            justifyContent="center"
            paddingHorizontal="12px"
            height={{ custom: ADD_BUTTON_HEIGHT }}
            borderRadius={ADD_BUTTON_HEIGHT / 2}
            backgroundColor={CASH_BALANCE_COLORS.addButton}
            shadow={{
              custom: {
                ios: [
                  { x: 0, y: 4, blur: 6, opacity: 0.3, color: { custom: CASH_BALANCE_COLORS.addButton } },
                  { x: 0, y: 1, blur: 2, opacity: 0.04, color: 'shadowFar' },
                ],
                android: { elevation: 8, opacity: 1, color: { custom: CASH_BALANCE_COLORS.addButton } },
              },
            }}
          >
            <Text color="white" size="17pt" weight="heavy">
              {i18n.t(i18n.l.button.add)}
            </Text>
          </Box>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
});
