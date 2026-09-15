import React from 'react';

import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Columns } from '@/design-system';

import { NumberPadKey, type NumberPadCharacter, type NumberPadField } from './NumberPadKey';

const BOTTOM_PADDING = 16;
export const CUSTOM_KEYBOARD_HEIGHT = 202 + BOTTOM_PADDING;

export type ValidationResult = {
  isValid: boolean;
  reason?: string;
};

export type NumberPadProps<K extends string> = {
  activeFieldId: SharedValue<K>;
  fields: SharedValue<Record<K, NumberPadField>>;
  formattedValues?: SharedValue<Record<K, string>>;
  /** Worklet admission check, called before field constraints and value updates. */
  onBeforeChange?: (fieldId: K, currentValue: string, newValue: string, key: NumberPadCharacter) => ValidationResult;
  /** Worklet feedback for a keypress rejected by admission or field constraints. */
  onInputRejected?: () => void;
  onValueChange?: (fieldId: K, newValue: string | number) => void;
  onIntervalStop?: () => void;
  isVisible?: SharedValue<boolean>;
  height?: number;
  stripFormatting?: (value: string) => string;
};

export const NumberPad = <K extends string>({
  activeFieldId,
  fields,
  onBeforeChange,
  onInputRejected,
  onValueChange,
  onIntervalStop,
  isVisible,
  height = CUSTOM_KEYBOARD_HEIGHT,
  stripFormatting = (value: string) => value.replace(/[^0-9.-]/g, ''),
}: NumberPadProps<K>) => {
  const longPressTimer = useSharedValue(0);

  const applyKey = (key: NumberPadCharacter): boolean => {
    'worklet';
    const fieldId = activeFieldId.value;
    const field = fields.value[fieldId];
    if (!field) return false;

    const currentValue = stripFormatting(String(field.value));
    let newValue: string;

    if (key === 'backspace') {
      newValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
    } else if (key === '.') {
      if (currentValue.includes('.')) return false;
      newValue = `${currentValue}.`;
    } else {
      newValue = currentValue === '0' ? String(key) : `${currentValue}${key}`;
    }

    if (onBeforeChange && !onBeforeChange(fieldId, currentValue, newValue, key).isValid) return false;

    if (key !== 'backspace') {
      if (key === '.' && field.allowDecimals === false) return false;
      const decimalIndex = newValue.indexOf('.');
      if (field.maxDecimals !== undefined && decimalIndex !== -1 && newValue.length - decimalIndex - 1 > field.maxDecimals) return false;
      if (field.maxLength !== undefined && newValue.length > field.maxLength) return false;
      if (!field.allowNegative && newValue.startsWith('-')) return false;
    } else {
      onIntervalStop?.();
    }

    fields.modify(currentFields => {
      currentFields[fieldId].value = newValue;
      return currentFields;
    });
    onValueChange?.(fieldId, newValue);
    return true;
  };

  const onKeyPress = (key: NumberPadCharacter): boolean => {
    'worklet';
    const accepted = applyKey(key);
    if (!accepted) onInputRejected?.();
    return accepted;
  };

  const containerStyle = useAnimatedStyle(() => {
    const shouldShow = isVisible?.value ?? true;
    return {
      opacity: withTiming(shouldShow ? 1 : 0, TIMING_CONFIGS.fadeConfig),
    };
  });

  return (
    <Box as={Animated.View} style={containerStyle} height={{ custom: height }} paddingHorizontal="6px" width="full">
      <Box style={{ gap: 6 }} width="full">
        <Columns space="6px">
          <NumberPadKey char={1} onPressWorklet={onKeyPress} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={2} onPressWorklet={onKeyPress} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={3} onPressWorklet={onKeyPress} fields={fields} activeFieldId={activeFieldId} />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char={4} onPressWorklet={onKeyPress} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={5} onPressWorklet={onKeyPress} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={6} onPressWorklet={onKeyPress} fields={fields} activeFieldId={activeFieldId} />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char={7} onPressWorklet={onKeyPress} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={8} onPressWorklet={onKeyPress} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={9} onPressWorklet={onKeyPress} fields={fields} activeFieldId={activeFieldId} />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char="." onPressWorklet={onKeyPress} transparent fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={0} onPressWorklet={onKeyPress} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey
            char="backspace"
            longPressTimer={longPressTimer}
            onPressWorklet={onKeyPress}
            small
            transparent
            fields={fields}
            activeFieldId={activeFieldId}
          />
        </Columns>
      </Box>
    </Box>
  );
};
