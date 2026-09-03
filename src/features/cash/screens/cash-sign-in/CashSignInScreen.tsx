import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Box, Text, useForegroundColor } from '@/design-system';
import { CashStepLayout } from '@/features/cash/components/CashStepLayout';
import { useSetupInputTextStyle } from '@/features/cash/components/useSetupInputTextStyle';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { replace, useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

import { isPasskeyCancellation } from '../../services/cashPasskeyService';
import { signInWithPhone } from '../../services/cashSignInService';
import { extractNationalDigits, formatNationalNumber, NATIONAL_NUMBER_LENGTH, US_COUNTRY_CALLING_CODE } from '../../utils/phoneNumber';

const l = i18n.l.cash.sign_in;

type SignInState = 'entry' | 'submitting' | 'error';

export const CashSignInScreen = memo(function CashSignInScreen() {
  const { goBack } = useNavigation();
  const [digits, setRawDigits] = useState('');
  const [state, setState] = useState<SignInState>('entry');
  const submitting = state === 'submitting';

  const labelQuaternary = useForegroundColor('labelQuaternary');
  const inputTextStyle = useSetupInputTextStyle();

  const setDigits = useCallback((text: string) => {
    setRawDigits(extractNationalDigits(text));
    setState(s => (s === 'submitting' ? s : 'entry'));
  }, []);

  const submit = useCallback(async () => {
    setState('submitting');
    try {
      await signInWithPhone(digits);
    } catch (e) {
      if (isPasskeyCancellation(e)) {
        setState('entry');
        return;
      }
      logger.error(new RainbowError('[CashSignInScreen]: Failed to sign in', e));
      setState('error');
      return;
    }

    replace(Routes.ADD_CASH_SHEET);
  }, [digits]);

  return (
    <CashStepLayout
      actionDisabled={digits.length !== NATIONAL_NUMBER_LENGTH}
      actionLabel={i18n.t(l.action)}
      actionLoading={submitting}
      actionTestID="cash-sign-in-next"
      backDisabled={submitting}
      backTestID="cash-sign-in-back"
      onAction={submit}
      onBack={goBack}
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
            testID="cash-sign-in-phone-input"
            textContentType="telephoneNumber"
            value={formatNationalNumber(digits)}
          />
        </Box>
        {state === 'error' && (
          <Text color="red" size="17pt" weight="semibold">
            {i18n.t(l.error)}
          </Text>
        )}
      </Box>
    </CashStepLayout>
  );
});

const styles = StyleSheet.create({
  input: {
    flex: 1,
  },
});
