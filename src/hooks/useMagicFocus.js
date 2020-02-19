import { useCallback, useRef } from 'react';
import { findNodeHandle, TextInput } from 'react-native';
import useNavigationWillFocusEffect from './useNavigationWillFocusEffect';

const { currentlyFocusedField, focusTextInput } = TextInput.State;

export default function useMagicFocus(autofocusTarget) {
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

  if (!focus.current) magicallyFocus();
  useNavigationWillFocusEffect(magicallyFocus);

  return [focus, handleFocus];
}
