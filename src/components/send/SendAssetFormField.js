import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';
import { UnderlineField } from '../fields';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

export default function SendAssetFormField({
  autoFocus,
  format,
  label,
  labelMaxLength = 6,
  mask,
  onChange,
  onFocus,
  onPressButton,
  placeholder,
  value,
  ...props
}) {
  const handlePressButton = useCallback(
    event => {
      analytics.track('Clicked "Max" in Send flow input');
      onPressButton?.(event);
    },
    [onPressButton]
  );

  return (
    <RowWithMargins
      align="center"
      flex={1}
      justify="space-between"
      margin={23}
      {...props}
    >
      <UnderlineField
        autoFocus={autoFocus}
        buttonText="Max"
        format={format}
        keyboardType="decimal-pad"
        mask={mask}
        onChange={onChange}
        onFocus={onFocus}
        onPressButton={handlePressButton}
        placeholder={placeholder}
        value={value}
      />
      <Text align="right" color="dark" size="h3">
        {label.length > labelMaxLength
          ? label.substring(0, labelMaxLength)
          : label}
      </Text>
    </RowWithMargins>
  );
}
