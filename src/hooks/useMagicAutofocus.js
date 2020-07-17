import { useCallback, useRef } from 'react';
import { findNodeHandle, TextInput } from 'react-native';

const { currentlyFocusedField, focusTextInput } = TextInput.State;

export default function useMagicAutofocus(autofocusTarget) {
  const focus = useRef(null);

  const handleFocus = useCallback(({ currentTarget }) => {
    focus.current = currentTarget;
  }, []);

  const magicallyFocus = useCallback(() => {
    if (!focus.current) {
      focusTextInput(findNodeHandle(autofocusTarget));
    } else if (focus.current !== currentlyFocusedField()) {
      focusTextInput(focus.current);
    }
  }, [autofocusTarget]);

  // ✨️ Make the magic happen
  if (!focus.current) {
    magicallyFocus();
  }

  return [handleFocus, focus, magicallyFocus];
}
