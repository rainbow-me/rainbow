import React, { memo, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { Box, Text } from '@/design-system';
import { useSetupInputTextStyle } from '@/features/cash/components/useSetupInputTextStyle';
import * as i18n from '@/languages';

import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { SetupStepLayout } from '../components/SetupStepLayout';
import { useSetupInputRef } from '../setupContext';

const l = i18n.l.cash.deposit_setup.ssn;

export const SsnStep = memo(function SsnStep() {
  const digits = useCashSetupSessionStore(s => s.getPersonalDetailsDraft('ssnLast4') ?? '');
  const inputRef = useRef<TextInput>(null);
  const registerInput = useSetupInputRef();
  const inputTextStyle = useSetupInputTextStyle();

  const focusInput = useCallback(() => inputRef.current?.focus(), []);
  const setInputRef = useCallback(
    (input: TextInput | null) => {
      inputRef.current = input;
      registerInput(input);
    },
    [registerInput]
  );

  return (
    <SetupStepLayout title={i18n.t(l.title)}>
      <Box gap={12} paddingTop="24px">
        <Pressable accessible={false} onPress={focusInput}>
          <Box alignItems="center" background="fillTertiary" borderRadius={20} flexDirection="row" style={styles.inputRow}>
            <Text color={digits ? 'label' : 'labelQuaternary'} size="17pt" weight="bold">
              {'*** **'}
            </Text>
            <TextInput
              keyboardType="number-pad"
              maxLength={4}
              onChangeText={useCashSetupSessionStore.getState().setSsnLast4}
              ref={setInputRef}
              style={[inputTextStyle, styles.input]}
              testID="cash-setup-ssn-input"
              value={digits}
            />
            <Text color="blue" size="17pt" weight="heavy">
              {'􀞙'}
            </Text>
          </Box>
        </Pressable>
        <Box style={styles.helper}>
          <Text color="labelQuaternary" size="13pt" weight="semibold">
            {i18n.t(l.helper)}
          </Text>
        </Box>
      </Box>
    </SetupStepLayout>
  );
});

const styles = StyleSheet.create({
  helper: {
    paddingLeft: 14,
  },
  input: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    flex: 1,
    paddingLeft: 8,
    paddingRight: 0,
  },
  inputRow: {
    height: 45,
    paddingLeft: 14,
    paddingRight: 16,
  },
});
