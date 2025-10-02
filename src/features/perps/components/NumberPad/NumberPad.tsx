import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Columns } from '@/design-system';
import React from 'react';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { NumberPadField, NumberPadKey } from './NumberPadKey';

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
  onBeforeChange?: (fieldId: K, currentValue: string, newValue: string) => ValidationResult;
  onValueChange?: (fieldId: K, newValue: string | number) => void;
  onStaleStateChange?: (isStale: boolean) => void;
  shouldMarkStale?: (fieldId: K, oldValue: string, newValue: string) => boolean;
  onIntervalStop?: () => void;
  isVisible?: SharedValue<boolean>;
  height?: number;
  stripFormatting?: (value: string) => string;
};

export const NumberPad = <K extends string>({
  activeFieldId,
  fields,
  onBeforeChange,
  onValueChange,
  onStaleStateChange,
  shouldMarkStale,
  onIntervalStop,
  isVisible,
  height = CUSTOM_KEYBOARD_HEIGHT,
  stripFormatting = (value: string) => value.replace(/[^0-9.-]/g, ''),
}: NumberPadProps<K>) => {
  const longPressTimer = useSharedValue(0);
  const isStale = useSharedValue(false);

  const getCurrentFieldValue = () => {
    'worklet';
    const fieldId = activeFieldId.value;
    const field = fields.value[fieldId];
    if (!field) return '0';

    const rawValue = String(field.value);
    return stripFormatting(rawValue);
  };

  const validateChange = (currentValue: string, newValue: string, addingDecimal = false) => {
    'worklet';
    const fieldId = activeFieldId.value;
    const field = fields.value[fieldId];

    if (!field) return false;

    if (addingDecimal && field.allowDecimals === false) {
      return false;
    }

    if (field.maxDecimals !== undefined && newValue.includes('.')) {
      const decimals = newValue.split('.')[1]?.length || 0;
      if (decimals > field.maxDecimals) {
        return false;
      }
    }

    if (field.maxLength !== undefined && newValue.length > field.maxLength) {
      return false;
    }

    if (!field.allowNegative && newValue.startsWith('-')) {
      return false;
    }

    return true;
  };

  const updateFieldValue = (newValue: string | number) => {
    'worklet';
    const fieldId = activeFieldId.value;
    const oldValue = getCurrentFieldValue();

    if (shouldMarkStale && shouldMarkStale(fieldId, oldValue, String(newValue))) {
      isStale.value = true;
      if (onStaleStateChange) {
        onStaleStateChange(true);
      }
    }

    fields.modify(currentFields => {
      currentFields[fieldId].value = newValue;
      return currentFields;
    });

    if (onValueChange) {
      onValueChange(fieldId, newValue);
    }
  };

  const addNumber = (number?: number) => {
    'worklet';
    if (number === undefined) return;

    const currentValue = getCurrentFieldValue();
    const fieldId = activeFieldId.value;

    // Replace 0 with the new number, otherwise append
    const newValue = currentValue === '0' ? String(number) : `${currentValue}${number}`;

    if (!validateChange(currentValue, newValue)) {
      return;
    }

    if (onBeforeChange) {
      const result = onBeforeChange(fieldId, currentValue, newValue);
      if (!result.isValid) {
        return;
      }
    }

    updateFieldValue(newValue);
  };

  const addDecimalPoint = () => {
    'worklet';
    const currentValue = getCurrentFieldValue();
    const fieldId = activeFieldId.value;

    if (currentValue.includes('.')) {
      return;
    }

    const newValue = `${currentValue}.`;

    if (!validateChange(currentValue, newValue, true)) {
      return;
    }

    if (onBeforeChange) {
      const result = onBeforeChange(fieldId, currentValue, newValue);
      if (!result.isValid) {
        return;
      }
    }

    updateFieldValue(newValue);
  };

  const deleteLastCharacter = () => {
    'worklet';
    const currentValue = getCurrentFieldValue();
    const fieldId = activeFieldId.value;

    // Handle deletion, ensuring a placeholder zero remains if the entire number is deleted
    const newValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';

    if (onBeforeChange) {
      const result = onBeforeChange(fieldId, currentValue, newValue);
      if (!result.isValid) {
        return;
      }
    }

    if (onIntervalStop) {
      onIntervalStop();
    }

    updateFieldValue(newValue);
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
          <NumberPadKey char={1} onPressWorklet={addNumber} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={2} onPressWorklet={addNumber} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={3} onPressWorklet={addNumber} fields={fields} activeFieldId={activeFieldId} />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char={4} onPressWorklet={addNumber} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={5} onPressWorklet={addNumber} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={6} onPressWorklet={addNumber} fields={fields} activeFieldId={activeFieldId} />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char={7} onPressWorklet={addNumber} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={8} onPressWorklet={addNumber} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={9} onPressWorklet={addNumber} fields={fields} activeFieldId={activeFieldId} />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char="." onPressWorklet={addDecimalPoint} transparent fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey char={0} onPressWorklet={addNumber} fields={fields} activeFieldId={activeFieldId} />
          <NumberPadKey
            char="backspace"
            longPressTimer={longPressTimer}
            onPressWorklet={deleteLastCharacter}
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
