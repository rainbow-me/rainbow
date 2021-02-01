import { useCallback, useRef } from 'react';
import useMagicAutofocus from './useMagicAutofocus';

export default function useSwapInputRefs({ inputCurrency, outputCurrency }) {
  const inputFieldRef = useRef();
  const nativeFieldRef = useRef();
  const outputFieldRef = useRef();

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

  return {
    handleFocus,
    inputFieldRef,
    lastFocusedInputHandle,
    nativeFieldRef,
    outputFieldRef,
  };
}
