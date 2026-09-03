import React, { memo } from 'react';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Box, Text } from '@/design-system';
import * as i18n from '@/languages';

import { OtpInput } from '../../../components/OtpInput';
import { OTP_LENGTH } from '../../../stores/verifyPhoneFlowStore';
import { KycOutcomeSheet } from '../components/KycOutcomeSheet';
import { SetupStepLayout } from '../components/SetupStepLayout';
import { useSetupInputRef } from '../setupContext';
import { useVerifyPhoneFlow } from './useVerifyPhoneFlow';

const l = i18n.l.cash.deposit_setup.confirm_phone;

export const ConfirmPhoneStep = memo(function ConfirmPhoneStep() {
  const { state, code, kycOutcome, continueAfterKyc, setCode, submit, resend, resending, resendCooldownSeconds } = useVerifyPhoneFlow();
  // Keep the retained OTP input disabled after advancing.
  const submitted = state === 'verifying' || state === 'submitted';
  const inputRef = useSetupInputRef();
  const cooling = resendCooldownSeconds > 0;
  const resendDisabled = submitted || cooling || resending;

  return (
    <>
      <SetupStepLayout title={i18n.t(l.title)}>
        <Box gap={16} paddingTop="24px">
          <OtpInput
            error={state === 'error'}
            inputRef={inputRef}
            length={OTP_LENGTH}
            onChange={newCode => {
              setCode(newCode);
              if (newCode.length === OTP_LENGTH) submit();
            }}
            value={code}
          />
          <ButtonPressAnimation disabled={resendDisabled} onPress={resend} testID="cash-setup-resend-code">
            <Text color={resendDisabled ? 'labelQuaternary' : 'blue'} size="17pt" weight="bold">
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

      {kycOutcome && <KycOutcomeSheet onContinue={continueAfterKyc} outcome={kycOutcome} />}
    </>
  );
});
