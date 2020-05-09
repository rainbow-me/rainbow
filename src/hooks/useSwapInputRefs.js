import { get } from 'lodash';
import { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import useInteraction from './useInteraction';
import useMagicFocus from './useMagicFocus';

const getNativeTag = field => get(field, '_nativeTag');

export default function useSwapInputRefs() {
  const inputFieldRef = useRef();
  const nativeFieldRef = useRef();
  const outputFieldRef = useRef();

  const [lastFocusedInput, handleFocus] = useMagicFocus(inputFieldRef.current);

  const [createRefocusInteraction] = useInteraction();

  const assignInputFieldRef = useCallback(ref => {
    inputFieldRef.current = ref;
  }, []);

  const assignNativeFieldRef = useCallback(ref => {
    nativeFieldRef.current = ref;
  }, []);

  const assignOutputFieldRef = useCallback(ref => {
    outputFieldRef.current = ref;
  }, []);

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

  const handleRefocusLastInput = useCallback(
    ({ inputCurrency, isScreenFocused, outputCurrency }) => {
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
    },
    [createRefocusInteraction, findNextFocused]
  );

  return {
    assignInputFieldRef,
    assignNativeFieldRef,
    assignOutputFieldRef,
    handleFocus,
    handleRefocusLastInput,
    inputFieldRef,
    lastFocusedInput,
    nativeFieldRef,
    outputFieldRef,
  };
}
