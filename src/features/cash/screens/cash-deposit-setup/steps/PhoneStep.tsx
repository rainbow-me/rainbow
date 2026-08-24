import React, { memo } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Box, Text, useForegroundColor } from '@/design-system';
import { useSetupInputTextStyle } from '@/features/cash/components/useSetupInputTextStyle';
import * as i18n from '@/languages';

import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { formatNationalNumber, US_COUNTRY_CALLING_CODE } from '../../../utils/phoneNumber';
import { SetupStepLayout } from '../components/SetupStepLayout';
import { useSetupInputRef } from '../setupContext';
import { useSubmitPhoneFlowStore } from './useSubmitPhoneFlow';

const l = i18n.l.cash.deposit_setup.phone;

export const PhoneStep = memo(function PhoneStep() {
  const isError = useSubmitPhoneFlowStore(s => s.state === 'error');
  const digits = useSubmitPhoneFlowStore(s => s.digits);
  const alreadyRegistered = useCashSetupSessionStore(s => s.session.status === 'phoneAlreadyRegistered');

  const inputRef = useSetupInputRef();

  const labelQuaternary = useForegroundColor('labelQuaternary');
  const inputTextStyle = useSetupInputTextStyle();

  return (
    <SetupStepLayout subtitle={i18n.t(l.subtitle)} title={i18n.t(l.title)}>
      <Box gap={12} paddingTop="24px">
        <Box flexDirection="row" gap={12}>
          <Box background="fillTertiary" borderRadius={20} justifyContent="center" paddingHorizontal="16px">
            <Text color="label" size="17pt" weight="bold">
              {`+${US_COUNTRY_CALLING_CODE}`}
            </Text>
          </Box>
          <TextInput
            keyboardType="phone-pad"
            onChangeText={useSubmitPhoneFlowStore.getState().setDigits}
            placeholder={i18n.t(l.placeholder)}
            placeholderTextColor={labelQuaternary}
            ref={inputRef}
            style={[inputTextStyle, styles.input]}
            testID="cash-setup-phone-input"
            textContentType="telephoneNumber"
            value={formatNationalNumber(digits)}
          />
        </Box>
        {(isError || alreadyRegistered) && (
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
