import { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import useMagicAutofocus from './useMagicAutofocus';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';

export default function useSwapInputRefs() {
  const { inputCurrency, outputCurrency } = useSwapInputOutputTokens();
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

  const { handleFocus, lastFocusedInputHandle } = useMagicAutofocus(
    inputFieldRef,
    findNextInput,
    true
  );

  const clearAllInputRefs = useCallback(() => {
    inputFieldRef?.current?.clear();
    nativeFieldRef?.current?.clear();
    outputFieldRef?.current?.clear();
  }, []);

  return {
    clearAllInputRefs,
    handleFocus,
    inputFieldRef,
    lastFocusedInputHandle,
    nativeFieldRef,
    outputFieldRef,
  };
}
