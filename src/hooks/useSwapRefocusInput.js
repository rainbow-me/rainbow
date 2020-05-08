import { get } from 'lodash';
import { useCallback } from 'react';
import { TextInput } from 'react-native';
import useInteraction from './useInteraction';

const getNativeTag = field => get(field, '_nativeTag');

export default function useSwapRefocusInput() {
  const [createRefocusInteraction] = useInteraction();

  const findNextFocused = useCallback(
    ({
      lastFocusedInput,
      inputCurrency,
      inputFieldRef,
      nativeFieldRef,
      outputFieldRef,
      outputCurrency,
    }) => {
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
    []
  );

  const handleRefocusLastInput = useCallback(
    ({
      inputCurrency,
      inputFieldRef,
      isScreenFocused,
      lastFocusedInput,
      nativeFieldRef,
      outputCurrency,
      outputFieldRef,
    }) => {
      createRefocusInteraction(() => {
        if (isScreenFocused) {
          TextInput.State.focusTextInput(
            findNextFocused({
              inputCurrency,
              inputFieldRef,
              lastFocusedInput,
              nativeFieldRef,
              outputCurrency,
              outputFieldRef,
            })
          );
        }
      });
    },
    [createRefocusInteraction, findNextFocused]
  );

  return {
    handleRefocusLastInput,
  };
}
