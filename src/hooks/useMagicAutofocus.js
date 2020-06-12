import { useCallback, useRef } from 'react';
import { findNodeHandle, TextInput } from 'react-native';
import { useNavigationEvents } from 'react-navigation-hooks';

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

  const handleNavigationEvents = useCallback(
    ({ action: { type } }) => {
      if (
        // fake version of 'didFocus'
        type === 'Navigation/COMPLETE_TRANSITION' ||
        // fake version of 'willFocus'
        (!focus.current && type === 'Navigation/NAVIGATE')
      ) {
        magicallyFocus();
      }
    },
    [focus, magicallyFocus]
  );

  // ✨️ Make the magic happen
  if (!focus.current) magicallyFocus();
  useNavigationEvents(handleNavigationEvents);

  return [handleFocus, focus];
}
