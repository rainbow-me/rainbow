import React, { memo } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Box, Text, useForegroundColor } from '@/design-system';
import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import { useSetupInputTextStyle } from '@/features/cash/components/useSetupInputTextStyle';
import * as i18n from '@/languages';

import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { formatNationalNumber, US_COUNTRY_CALLING_CODE } from '../../../utils/phoneNumber';
import { SetupStepLayout } from '../components/SetupStepLayout';
import { recoverExistingAccount, signInToExistingAccount } from '../setupAction';
import { useSetupInputRef } from '../setupContext';
import { useSubmitPhoneFlowStore } from './useSubmitPhoneFlow';

const l = i18n.l.cash.deposit_setup.phone;
const existingAccountL = i18n.l.cash.deposit_setup.phone.existing_account;

export const PhoneStep = memo(function PhoneStep() {
  const state = useSubmitPhoneFlowStore(store => store.state);
  const digits = useSubmitPhoneFlowStore(store => store.digits);
  const alreadyRegistered = useCashSetupSessionStore(s => s.session.status === 'phoneAlreadyRegistered');
  const inputRef = useSetupInputRef();

  const labelQuaternary = useForegroundColor('labelQuaternary');
  const inputTextStyle = useSetupInputTextStyle();

  return (
    <>
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
          {(state === 'error' || alreadyRegistered) && (
            <Text color="red" size="17pt" weight="semibold">
              {i18n.t(alreadyRegistered ? l.already_registered : l.error)}
            </Text>
          )}
        </Box>
      </SetupStepLayout>

      {(state === 'existingAccount' || state === 'signingIn') && (
        <CashStatusHalfSheet
          description={i18n.t(existingAccountL.description)}
          primaryAction={{
            label: i18n.t(existingAccountL.sign_in),
            loading: state === 'signingIn',
            onPress: signInToExistingAccount,
            testID: 'cash-setup-existing-account-sign-in',
          }}
          secondaryAction={{
            disabled: state === 'signingIn',
            label: i18n.t(existingAccountL.recover),
            onPress: recoverExistingAccount,
            testID: 'cash-setup-existing-account-recover',
          }}
          status="error"
          testID="cash-setup-existing-account"
          title={i18n.t(existingAccountL.title)}
        />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  input: {
    flex: 1,
  },
});
