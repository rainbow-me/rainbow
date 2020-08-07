import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { findNodeHandle, InteractionManager, TextInput } from 'react-native';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';
import { setListener } from '../navigation/nativeStackHelpers';
import useInteraction from './useInteraction';

const { currentlyFocusedField, focusTextInput } = TextInput.State;

let timeout = null;
let delay = false;

export function delayNext() {
  if (timeout !== null) {
    clearTimeout(timeout);
    timeout = null;
  }
  delay = true;
}

export default function useMagicAutofocus(
  defaultAutofocusInputRef,
  customTriggerFocusCallback
) {
  const isScreenFocused = useIsFocused();
  const lastFocusedInputHandle = useRef(null);

  const handleFocus = useCallback(({ currentTarget }) => {
    lastFocusedInputHandle.current = currentTarget;
  }, []);

  const triggerFocus = useCallback(() => {
    if (!lastFocusedInputHandle.current) {
      return focusTextInput(findNodeHandle(defaultAutofocusInputRef.current));
    }

    if (customTriggerFocusCallback) {
      const nextInput = customTriggerFocusCallback(lastFocusedInputHandle);
      return nextInput && focusTextInput(nextInput);
    }

    if (lastFocusedInputHandle.current !== currentlyFocusedField()) {
      return focusTextInput(lastFocusedInputHandle.current);
    }
  }, [customTriggerFocusCallback, defaultAutofocusInputRef]);

  const [createRefocusInteraction] = useInteraction();
  const fallbackRefocusLastInput = useCallback(() => {
    createRefocusInteraction(() => {
      if (isScreenFocused) {
        triggerFocus();
      }
    });
  }, [createRefocusInteraction, isScreenFocused, triggerFocus]);

  // ✨️ Make the magic happen
  useFocusEffect(
    useCallback(() => {
      setListener(triggerFocus);
      if (delay) {
        InteractionManager.runAfterInteractions(() => {
          if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
          }
          timeout = setTimeout(() => {
            triggerFocus();
            delay = false;
          }, 200);
        });
      } else {
        triggerFocus();
      }

      // We need to do this in order to assure that the input gets focused
      // when using fallback stacks.
      if (!isNativeStackAvailable) {
        InteractionManager.runAfterInteractions(fallbackRefocusLastInput);
      }

      return () => {
        setListener(null);
      };
    }, [fallbackRefocusLastInput, triggerFocus])
  );

  return {
    handleFocus,
    lastFocusedInputHandle,
    triggerFocus,
  };
}
