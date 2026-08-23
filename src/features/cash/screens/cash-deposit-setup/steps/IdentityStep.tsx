import React, { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { Box, Text, useForegroundColor } from '@/design-system';
import { useSetupInputTextStyle } from '@/features/cash/components/useSetupInputTextStyle';
import { useDatePicker } from '@/framework/ui/hooks/useDatePicker';
import * as i18n from '@/languages';

import { formatDateOfBirth, isValidDateOfBirth, isValidLegalName, toDate, toDateOfBirth } from '../../../services/cashSetupIdentityService';
import { useCashSetupSessionStore, type CashSetupDateOfBirth } from '../../../stores/cashSetupSessionStore';
import { SetupStepLayout } from '../components/SetupStepLayout';
import { useSetupInputRef } from '../setupContext';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

const l = i18n.l.cash.deposit_setup.identity;

function getMaximumDateOfBirth(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 1);
  return date;
}

function getInitialDateOfBirth(maximumDate: Date): Date {
  const date = new Date(maximumDate);
  date.setFullYear(date.getFullYear() - 18);
  return date;
}

export const IdentityStep = memo(function IdentityStep() {
  const storedIdentity = useCashSetupSessionStore(state => (state.session.status === 'phoneVerified' ? state.session.identity : null));
  const [firstName, setFirstName] = useState(storedIdentity?.firstName ?? '');
  const [lastName, setLastName] = useState(storedIdentity?.lastName ?? '');
  const [maximumDateOfBirth] = useState(getMaximumDateOfBirth);
  const [initialDateOfBirth] = useState(() => getInitialDateOfBirth(maximumDateOfBirth));
  const [dateOfBirth, setDateOfBirth] = useState<CashSetupDateOfBirth | null>(storedIdentity?.dateOfBirth ?? null);
  const canContinue = isValidLegalName(firstName) && isValidLegalName(lastName) && dateOfBirth !== null && isValidDateOfBirth(dateOfBirth);
  const inputTextStyle = useSetupInputTextStyle();
  const firstNameInputRef = useSetupInputRef();
  const labelQuaternary = useForegroundColor('labelQuaternary');
  const { next } = useCashDepositSetupNavigation();
  const handleDateOfBirthChange = useCallback((date: Date) => setDateOfBirth(toDateOfBirth(date)), []);
  const { openPicker, picker } = useDatePicker({
    confirmLabel: i18n.t(i18n.l.button.done),
    initialDate: initialDateOfBirth,
    maximumDate: maximumDateOfBirth,
    onChange: handleDateOfBirthChange,
    testID: 'cash-setup-dob-picker',
    value: dateOfBirth ? toDate(dateOfBirth) : null,
  });

  const submit = useCallback(() => {
    if (!canContinue) return;
    useCashSetupSessionStore.getState().setIdentity({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
    });
    next();
  }, [canContinue, dateOfBirth, firstName, lastName, next]);

  return (
    <SetupStepLayout actionDisabled={!canContinue} onAction={submit} title={i18n.t(l.title)}>
      <Box paddingTop="24px">
        <Box flexDirection="row" gap={12}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
            onChangeText={setFirstName}
            placeholder={i18n.t(l.first_name)}
            placeholderTextColor={labelQuaternary}
            ref={firstNameInputRef}
            style={[inputTextStyle, styles.nameInput]}
            testID="cash-setup-first-name-input"
            textContentType="givenName"
            value={firstName}
          />
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
            onChangeText={setLastName}
            placeholder={i18n.t(l.last_name)}
            placeholderTextColor={labelQuaternary}
            style={[inputTextStyle, styles.nameInput]}
            testID="cash-setup-last-name-input"
            textContentType="familyName"
            value={lastName}
          />
        </Box>

        <Box paddingTop="24px" style={styles.dateOfBirthLabel}>
          <Text color="label" size="17pt" weight="bold">
            {i18n.t(l.date_of_birth)}
          </Text>
        </Box>
        <Box paddingTop="12px">
          <Pressable
            accessibilityLabel={i18n.t(l.date_of_birth)}
            accessibilityRole="button"
            onPress={openPicker}
            style={({ pressed }) => [styles.dateOfBirthInput, pressed && styles.dateOfBirthInputPressed]}
            testID="cash-setup-dob-input"
          >
            <Box background="fillTertiary" borderRadius={20} height={45} justifyContent="center" paddingHorizontal="16px">
              <Text color={dateOfBirth ? 'label' : 'labelQuaternary'} size="17pt" tabularNumbers weight="bold">
                {dateOfBirth ? formatDateOfBirth(dateOfBirth) : i18n.t(l.date_of_birth_placeholder)}
              </Text>
            </Box>
          </Pressable>
        </Box>
        {picker}
      </Box>
    </SetupStepLayout>
  );
});

const styles = StyleSheet.create({
  dateOfBirthInput: {
    width: '100%',
  },
  dateOfBirthInputPressed: {
    opacity: 0.7,
  },
  dateOfBirthLabel: {
    paddingLeft: 14,
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
  },
});
