import React, { memo, useEffect } from 'react';
import { Keyboard, StyleSheet } from 'react-native';

import { Box, Text } from '@/design-system';
import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';

import { useCashDepositSetupNavigationStore } from '../cashDepositSetupNavigator';
import { SetupStepLayout } from '../components/SetupStepLayout';
import { useAddPasskeyFlow } from './useAddPasskeyFlow';

const l = i18n.l.cash.deposit_setup.passkey;

const KEY_ICON = '􀟖';

export const PasskeyStep = memo(function PasskeyStep() {
  const { reset, state, submit } = useAddPasskeyFlow();
  const isActiveStep = useCashDepositSetupNavigationStore(s => s.activeRoute === Routes.CASH_SETUP_PASSKEY);
  const submitting = state === 'submitting';

  useEffect(() => {
    if (isActiveStep) Keyboard.dismiss();
  }, [isActiveStep]);

  return (
    <>
      <SetupStepLayout
        actionLabel={i18n.t(l.action)}
        actionLoading={submitting}
        backDisabled={submitting}
        onAction={submit}
        subtitle={i18n.t(l.subtitle)}
        title={i18n.t(l.title)}
      >
        <Box alignItems="center" height="full" justifyContent="center">
          <Text align="center" color="blue" size="44pt" style={styles.keyIcon} weight="heavy">
            {KEY_ICON}
          </Text>
        </Box>
      </SetupStepLayout>

      {state === 'error' && (
        <CashStatusHalfSheet
          description={i18n.t(l.error_description)}
          primaryAction={{ label: i18n.t(l.try_again), onPress: submit, testID: 'cash-setup-passkey-error-retry' }}
          secondaryAction={{ label: i18n.t(i18n.l.button.cancel), onPress: reset, testID: 'cash-setup-passkey-error-cancel' }}
          status="error"
          testID="cash-setup-passkey-error"
          title={i18n.t(l.error_title)}
        />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  keyIcon: {
    lineHeight: 64,
  },
});
