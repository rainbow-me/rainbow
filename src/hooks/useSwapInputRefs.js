import { get } from 'lodash';
import { useCallback, useEffect, useRef } from 'react';
import { TextInput } from 'react-native';
import { useIsFocused } from 'react-navigation-hooks';
import useInteraction from './useInteraction';
import useMagicFocus from './useMagicFocus';
import usePrevious from './usePrevious';

const getNativeTag = field => get(field, '_nativeTag');

export default function useSwapInputRefs({ inputCurrency, outputCurrency }) {
  const isScreenFocused = useIsFocused();
  const wasScreenFocused = usePrevious(isScreenFocused);

  const inputFieldRef = useRef();
  const nativeFieldRef = useRef();
  const outputFieldRef = useRef();

  const [lastFocusedInput, handleFocus] = useMagicFocus(inputFieldRef.current);

  const [createRefocusInteraction] = useInteraction();

  const findNextFocused = useCallback(
    ({ inputCurrency, outputCurrency }) => {
      const inputRefTag = getNativeTag(inputFieldRef.current);
      const nativeInputRefTag = getNativeTag(nativeFieldRef.current);
      const outputRefTag = getNativeTag(outputFieldRef.current);

      const lastFocusedIsInputType =
        lastFocusedInput &&
        (lastFocusedInput.current === inputRefTag ||
          lastFocusedInput.current === nativeInputRefTag);

      const lastFocusedIsOutputType =
        lastFocusedInput && lastFocusedInput.current === outputRefTag;

      if (lastFocusedIsInputType && !inputCurrency) {
        return outputRefTag;
      }

      if (lastFocusedIsOutputType && !outputCurrency) {
        return inputRefTag;
      }

      return lastFocusedInput.current;
    },
    [lastFocusedInput]
  );

  const handleRefocusLastInput = useCallback(() => {
    createRefocusInteraction(() => {
      if (isScreenFocused) {
        TextInput.State.focusTextInput(
          findNextFocused({
            inputCurrency,
            outputCurrency,
          })
        );
      }
    });
  }, [
    createRefocusInteraction,
    findNextFocused,
    inputCurrency,
    isScreenFocused,
    outputCurrency,
  ]);

  // Refocus when screen changes to focused
  useEffect(() => {
    if (isScreenFocused && !wasScreenFocused) {
      handleRefocusLastInput();
    }
  }, [handleRefocusLastInput, isScreenFocused, wasScreenFocused]);

  return {
    handleFocus,
    inputFieldRef,
    nativeFieldRef,
    outputFieldRef,
  };
}
