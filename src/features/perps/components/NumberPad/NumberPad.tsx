import React from 'react';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Bleed, Box, Columns, Separator, useColorMode } from '@/design-system';
import { NumberPadKey, NumberPadField } from './NumberPadKey';

const CUSTOM_KEYBOARD_HEIGHT = 276;
const LIGHT_SEPARATOR_COLOR = 'rgba(60, 60, 67, 0.36)';
const SEPARATOR_COLOR = 'rgba(84, 84, 88, 0.65)';

export type ValidationResult = {
  isValid: boolean;
  reason?: string;
};

export type NumberPadProps = {
  activeFieldId: SharedValue<string>;
  fields: SharedValue<Record<string, NumberPadField>>;
  formattedValues?: SharedValue<Record<string, string>>;
  onBeforeChange?: (fieldId: string, currentValue: string, newValue: string) => ValidationResult;
  onValueChange?: (fieldId: string, newValue: string | number) => void;
  onFieldChange?: (fieldId: string) => void;
  onStaleStateChange?: (isStale: boolean) => void;
  shouldMarkStale?: (fieldId: string, oldValue: string, newValue: string) => boolean;
  onIntervalStop?: () => void;
  isVisible?: SharedValue<boolean>;
  height?: number;
  stripFormatting?: (value: string) => string;
};

export const NumberPad = ({
  activeFieldId,
  fields,
  formattedValues,
  onBeforeChange,
  onValueChange,
  onFieldChange,
  onStaleStateChange,
  shouldMarkStale,
  onIntervalStop,
  isVisible,
  height = CUSTOM_KEYBOARD_HEIGHT,
  stripFormatting = (value: string) => value.replace(/[^0-9.-]/g, ''),
}: NumberPadProps) => {
  const { isDarkMode } = useColorMode();
  const longPressTimer = useSharedValue(0);
  const isStale = useSharedValue(false);

  const getCurrentFieldValue = () => {
    'worklet';
    const fieldId = activeFieldId.value;
    const field = fields.value[fieldId];
    if (!field) return '0';

    const rawValue = String(field.value);
    if (formattedValues?.value[fieldId]) {
      return stripFormatting(formattedValues.value[fieldId]);
    }
    return stripFormatting(rawValue);
  };

  const validateChange = (currentValue: string, newValue: string, addingDecimal: boolean = false) => {
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

    fields.modify(currentFields => ({
      ...currentFields,
      [fieldId]: {
        ...currentFields[fieldId],
        value: newValue,
      },
    }));

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
        <Bleed horizontal="6px">
          <Separator
            color={{
              custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
            }}
            thickness={1}
          />
        </Bleed>
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
