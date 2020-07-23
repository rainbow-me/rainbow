import { useCallback, useRef } from 'react';
import { findNodeHandle } from 'react-native';
import useMagicAutofocus from './useMagicAutofocus';

export default function useSwapInputRefs({ inputCurrency, outputCurrency }) {
  const inputFieldRef = useRef();
  const nativeFieldRef = useRef();
  const outputFieldRef = useRef();

  const findNextInput = useCallback(
    currentFocusedInputHandle => {
      const inputRefHandle = findNodeHandle(inputFieldRef.current);
      const nativeInputRefHandle = findNodeHandle(nativeFieldRef.current);
      const outputRefHandle = findNodeHandle(outputFieldRef.current);

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

  const { handleFocus } = useMagicAutofocus(inputFieldRef, findNextInput);

  return {
    handleFocus,
    inputFieldRef,
    nativeFieldRef,
    outputFieldRef,
  };
}
