import { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import useMagicAutofocus from './useMagicAutofocus';
import useSwapCurrencies from './useSwapCurrencies';

export default function useSwapInputRefs() {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const inputFieldRef = useRef<TextInput>();
  const nativeFieldRef = useRef<TextInput>();
  const outputFieldRef = useRef<TextInput>();

  const findNextInput = useCallback(
    currentFocusedInputHandle => {
      const inputRefHandle = inputFieldRef.current;
      const nativeInputRefHandle = nativeFieldRef.current;
      const outputRefHandle = outputFieldRef.current;

      const lastFocusedIsInputType =
        currentFocusedInputHandle?.current === inputRefHandle ||
        currentFocusedInputHandle?.current === nativeInputRefHandle;

      const lastFocusedIsOutputType =
        currentFocusedInputHandle?.current === outputRefHandle;

      if (lastFocusedIsInputType && !inputCurrency) {
        return outputRefHandle;
      }

      if (lastFocusedIsOutputType && !outputCurrency) {
        return inputRefHandle;
      }

      return currentFocusedInputHandle.current;
    },
    [inputCurrency, outputCurrency]
  );

  const {
    handleFocus,
    lastFocusedInputHandle,
    setLastFocusedInputHandle,
  } = useMagicAutofocus(inputFieldRef, findNextInput, true);

  return {
    handleFocus,
    inputFieldRef,
    lastFocusedInputHandle,
    nativeFieldRef,
    outputFieldRef,
    setLastFocusedInputHandle,
  };
}
