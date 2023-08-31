import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef } from 'react';
import { InteractionManager, TextInput } from 'react-native';
import { setListener } from '@/navigation/nativeStackHelpers';
import useInteraction from './useInteraction';
import { IS_ANDROID } from '@/env';

const { currentlyFocusedInput, focusTextInput } = TextInput.State;

let timeout: ReturnType<typeof setTimeout> | null = null;
let delay = false;
let cancel = false;
let cancelAll = false;

export function delayNext() {
  if (timeout !== null) {
    clearTimeout(timeout);
    timeout = null;
  }
  delay = true;
  cancel = false;
}

export function cancelNext() {
  cancel = true;
}

export function uncancelNext() {
  cancel = false;
}

export function disable() {
  cancelAll = true;
}

export function enable() {
  cancelAll = false;
}

export default function useMagicAutofocus(
  defaultAutofocusInputRef: any,
  customTriggerFocusCallback: any,
  shouldFocusOnNavigateOnAndroid = false,
  showAfterInteractions = false
) {
  const isScreenFocused = useIsFocused();
  const lastFocusedInputHandle = useRef(null);

  const handleFocus = useCallback(({ target }: { target: any }) => {
    lastFocusedInputHandle.current = target.getNativeRef();
  }, []);

  const setLastFocusedInputHandle = useCallback((ref: React.RefObject<any>) => {
    lastFocusedInputHandle.current = ref.current;
  }, []);

  const triggerFocus = useCallback(() => {
    if (cancel || cancelAll) {
      cancel = false;
      return;
    }

    if (!lastFocusedInputHandle.current) {
      return focusTextInput(defaultAutofocusInputRef.current);
    }

    if (customTriggerFocusCallback) {
      const nextInput = customTriggerFocusCallback(lastFocusedInputHandle);
      return nextInput && focusTextInput(nextInput);
    }

    if (lastFocusedInputHandle.current !== currentlyFocusedInput()) {
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
      if (android && !shouldFocusOnNavigateOnAndroid) {
        return;
      }

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
          }, 400);
        });
      } else if (IS_ANDROID) {
        // We need to do this in order to assure that the input gets focused
        // when using fallback stacks.
        InteractionManager.runAfterInteractions(fallbackRefocusLastInput);
      } else {
        if (showAfterInteractions) {
          InteractionManager.runAfterInteractions(triggerFocus);
        } else {
          triggerFocus();
        }
      }
    }, [
      fallbackRefocusLastInput,
      shouldFocusOnNavigateOnAndroid,
      showAfterInteractions,
      triggerFocus,
    ])
  );

  useEffect(() => () => setListener(null), []);

  return {
    handleFocus,
    lastFocusedInputHandle,
    setLastFocusedInputHandle,
    triggerFocus,
  };
}
