import { forwardRef, useImperativeHandle } from 'react';
import { SharedValue, runOnUI } from 'react-native-reanimated';
import { stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
// TODO: Not currently used. If need custom number pad input for `CurrencyInput`, we can use this.

export interface CurrencyInputControllerRef {
  addNumber: (number: number) => void;
  addDecimalPoint: () => void;
  deleteLastCharacter: () => void;
  clear: () => void;
}

interface CurrencyInputControllerProps {
  value: SharedValue<string>;
  onValueChange: (value: string) => void;
  maxDecimals?: number;
}

function ignoreChange({
  currentValue,
  addingDecimal = false,
  maxDecimals = 18,
}: {
  currentValue?: string;
  addingDecimal?: boolean;
  maxDecimals?: number;
}) {
  'worklet';

  // Check if exceeds max decimals
  if (currentValue?.includes('.')) {
    const currentDecimals = currentValue.split('.')[1]?.length ?? -1;
    if (currentDecimals >= maxDecimals) return true;
  }

  // Check if adding decimal when decimals not allowed
  if (addingDecimal && maxDecimals === 0) {
    return true;
  }

  return false;
}

function removeFormatting(value: SharedValue<string>) {
  'worklet';
  return stripNonDecimalNumbers(value.value);
}

export const CurrencyInputController = forwardRef<CurrencyInputControllerRef, CurrencyInputControllerProps>(
  ({ value, onValueChange, maxDecimals = 18 }, ref) => {
    const addNumber = (number: number) => {
      'worklet';
      const currentValue = removeFormatting(value);

      if (ignoreChange({ currentValue })) return;

      const newValue = currentValue === '0' || currentValue === '' ? `${number}` : `${currentValue}${number}`;

      // Check max length (uint256 max is 78 digits)
      if (newValue.length > 78) return;

      onValueChange(newValue);
    };

    const addDecimalPoint = () => {
      'worklet';
      const currentValue = removeFormatting(value);

      if (ignoreChange({ currentValue, addingDecimal: true, maxDecimals })) {
        return;
      }

      if (!currentValue.includes('.')) {
        const valueToUse = currentValue === '' ? '0' : currentValue;
        const newValue = `${valueToUse}.`;
        onValueChange(newValue);
      }
    };

    const deleteLastCharacter = () => {
      'worklet';
      const currentValue = removeFormatting(value);

      if (ignoreChange({ maxDecimals })) {
        return;
      }

      const newValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '';
      onValueChange(newValue);
    };

    const clear = () => {
      'worklet';
      onValueChange('');
    };

    useImperativeHandle(
      ref,
      () => ({
        addNumber: (number: number) => {
          runOnUI(addNumber)(number);
        },
        addDecimalPoint: () => {
          runOnUI(addDecimalPoint)();
        },
        deleteLastCharacter: () => {
          runOnUI(deleteLastCharacter)();
        },
        clear: () => {
          runOnUI(clear)();
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    return null;
  }
);

CurrencyInputController.displayName = 'CurrencyInputController';
