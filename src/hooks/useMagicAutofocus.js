import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { findNodeHandle, InteractionManager, TextInput } from 'react-native';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';
import { setListener } from '../navigation/nativeStackHelpers';
import useInteraction from './useInteraction';

const { currentlyFocusedField, focusTextInput } = TextInput.State;

export default function useMagicAutofocus(
  defaultAutofocusInputRef,
  findNextInput
) {
  const isScreenFocused = useIsFocused();
  const lastFocusedInputHandle = useRef(null);

  const handleFocus = useCallback(({ currentTarget }) => {
    lastFocusedInputHandle.current = currentTarget;
  }, []);

  const triggerFocus = useCallback(() => {
    const defaultHandle = findNodeHandle(defaultAutofocusInputRef.current);

    if (!lastFocusedInputHandle.current) {
      return focusTextInput(defaultHandle);
    }

    if (findNextInput) {
      const nextInput = findNextInput(lastFocusedInputHandle);
      return focusTextInput(nextInput || defaultHandle);
    }

    if (lastFocusedInputHandle.current !== currentlyFocusedField()) {
      return focusTextInput(lastFocusedInputHandle.current);
    }
  }, [findNextInput, defaultAutofocusInputRef]);

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
      triggerFocus();

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
