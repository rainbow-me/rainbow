import React, { memo, useCallback, useRef, type Ref } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Box, Text, useForegroundColor } from '@/design-system';

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  length: number;
  error?: boolean;
  inputRef?: Ref<TextInput>;
  testID?: string;
};

export const OtpInput = memo(function OtpInput({ value, onChange, length, error = false, inputRef, testID = 'otp-input' }: OtpInputProps) {
  const red = useForegroundColor('red');
  const fallbackInputRef = useRef<TextInput>(null);

  const onChangeText = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, '').slice(0, length);
      if (digits === value) return;
      onChange(digits);
    },
    [length, onChange, value]
  );

  return (
    <Box flexDirection="row" gap={8}>
      {Array.from({ length }, (_, index) => (
        <Box
          alignItems="center"
          background="fillTertiary"
          borderRadius={20}
          flexBasis={0}
          flexGrow={1}
          height={{ custom: 56 }}
          justifyContent="center"
          key={index}
          style={{ borderColor: error ? red : 'transparent', borderWidth: 2 }}
        >
          <Text align="center" color={error ? 'red' : 'label'} size="22pt" weight="heavy">
            {value[index] ?? ''}
          </Text>
        </Box>
      ))}
      <TextInput
        autoComplete="sms-otp"
        caretHidden
        keyboardType="number-pad"
        maxLength={length}
        onChangeText={onChangeText}
        ref={inputRef ?? fallbackInputRef}
        style={styles.hiddenInput}
        testID={testID}
        textContentType="oneTimeCode"
        value={value}
      />
    </Box>
  );
});

const styles = StyleSheet.create({
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
  },
});
