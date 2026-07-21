import React, { memo } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Box, Text, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';

import { US_COUNTRY_CALLING_CODE } from '../../../services/userClient';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { SetupStepLayout } from '../components/SetupStepLayout';
import { useSetupInputTextStyle } from '../components/useSetupInputTextStyle';
import { NATIONAL_NUMBER_LENGTH, useSubmitPhoneFlow } from './useSubmitPhoneFlow';

const l = i18n.l.cash.deposit_setup.phone;

function formatNationalNumber(digits: string): string {
  if (!digits) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export const PhoneStep = memo(function PhoneStep() {
  const { state, digits, setDigits, submit } = useSubmitPhoneFlow();
  const alreadyRegistered = useCashSetupSessionStore(s => s.session.status === 'phoneAlreadyRegistered');
  const submitting = state === 'submitting';

  const labelQuaternary = useForegroundColor('labelQuaternary');
  const inputTextStyle = useSetupInputTextStyle();

  return (
    <SetupStepLayout
      actionDisabled={digits.length !== NATIONAL_NUMBER_LENGTH}
      actionLoading={submitting}
      backDisabled={submitting}
      onAction={submit}
      subtitle={i18n.t(l.subtitle)}
      title={i18n.t(l.title)}
    >
      <Box gap={12} paddingTop="24px">
        <Box flexDirection="row" gap={12}>
          <Box background="fillTertiary" borderRadius={20} justifyContent="center" paddingHorizontal="16px">
            <Text color="label" size="17pt" weight="bold">
              {`+${US_COUNTRY_CALLING_CODE}`}
            </Text>
          </Box>
          <TextInput
            autoFocus
            editable={!submitting}
            keyboardType="phone-pad"
            onChangeText={setDigits}
            placeholder={i18n.t(l.placeholder)}
            placeholderTextColor={labelQuaternary}
            style={[inputTextStyle, styles.input]}
            testID="cash-setup-phone-input"
            textContentType="telephoneNumber"
            value={formatNationalNumber(digits)}
          />
        </Box>
        {(state === 'error' || alreadyRegistered) && (
          <Text color="red" size="17pt" weight="semibold">
            {i18n.t(alreadyRegistered ? l.already_registered : l.error)}
          </Text>
        )}
      </Box>
    </SetupStepLayout>
  );
});

const styles = StyleSheet.create({
  input: {
    flex: 1,
  },
});
