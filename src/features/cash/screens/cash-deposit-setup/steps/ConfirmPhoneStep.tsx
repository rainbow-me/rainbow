import React, { memo } from 'react';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text } from '@/design-system';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';

import { OtpInput } from '../../../components/OtpInput';
import { OTP_LENGTH } from '../../../stores/verifyPhoneFlowStore';
import { useCashDepositSetupNavigationStore } from '../cashDepositSetupNavigator';
import { SetupStepLayout } from '../components/SetupStepLayout';
import { useVerifyPhoneFlow } from './useVerifyPhoneFlow';

const l = i18n.l.cash.deposit_setup.confirm_phone;

export const ConfirmPhoneStep = memo(function ConfirmPhoneStep() {
  const { state, code, setCode, submit, resend, resending, resendCooldownSeconds } = useVerifyPhoneFlow();
  // The pager keeps visited steps mounted, so focus is tied to the step being active rather than to mount.
  const isActiveStep = useCashDepositSetupNavigationStore(s => s.activeRoute === Routes.CASH_SETUP_CONFIRM_PHONE);
  const verifying = state === 'verifying';
  const cooling = resendCooldownSeconds > 0;

  return (
    <SetupStepLayout
      actionDisabled={code.length !== OTP_LENGTH}
      actionLabel={i18n.t(l.confirm)}
      actionLoading={verifying}
      backDisabled={verifying}
      onAction={submit}
      title={i18n.t(l.title)}
    >
      <Box gap={16} paddingTop="24px">
        <OtpInput
          disabled={verifying}
          error={state === 'error'}
          focused={isActiveStep}
          length={OTP_LENGTH}
          onChange={newCode => {
            setCode(newCode);
            if (newCode.length === OTP_LENGTH) submit();
          }}
          value={code}
        />
        <ButtonPressAnimation disabled={cooling || resending} onPress={resend} testID="cash-setup-resend-code">
          <Text color={cooling ? 'labelQuaternary' : 'blue'} size="17pt" weight="bold">
            {cooling ? `${i18n.t(l.resend_code)} (${resendCooldownSeconds})` : i18n.t(l.resend_code)}
          </Text>
        </ButtonPressAnimation>
        {state === 'error' && (
          <Text color="red" size="17pt" weight="semibold">
            {i18n.t(l.error)}
          </Text>
        )}
      </Box>
    </SetupStepLayout>
  );
});
