import React, { memo, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Box, Text, useForegroundColor } from '@/design-system';

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  length: number;
  disabled?: boolean;
  error?: boolean;
  focused?: boolean;
  testID?: string;
};

export const OtpInput = memo(function OtpInput({
  value,
  onChange,
  length,
  disabled = false,
  error = false,
  focused = true,
  testID = 'otp-input',
}: OtpInputProps) {
  const red = useForegroundColor('red');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (disabled || !focused) inputRef.current?.blur();
    else inputRef.current?.focus();
  }, [disabled, focused]);

  const onChangeText = useCallback(
    (text: string) => {
      if (disabled) return;
      const digits = text.replace(/\D/g, '').slice(0, length);
      if (digits === value) return;
      onChange(digits);
    },
    [disabled, length, onChange, value]
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
        ref={inputRef}
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
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
});
