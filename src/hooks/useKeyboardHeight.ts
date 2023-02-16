import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import KeyboardTypes from '@/helpers/keyboardTypes';
import { setKeyboardHeight } from '@/redux/keyboardHeight';
import { AppState } from '@/redux/store';

const keyboardHeightsSelector = (state: AppState) =>
  state.keyboardHeight.keyboardHeight;

export default function useKeyboardHeight(options = {}) {
  // keyboards can different heights depending on whether
  // things like "autofill" or "autocomplete" are enabled on the target input.
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'keyboardType' does not exist on type '{}... Remove this comment to see the full error message
  const { keyboardType = KeyboardTypes.default } = options;

  const dispatch = useDispatch();

  const cachedKeyboardHeights = useSelector(keyboardHeightsSelector);
  const heightForKeyboardType =
    cachedKeyboardHeights?.[keyboardType as keyof typeof cachedKeyboardHeights];

  const isFocused = useIsFocused();

  const handleKeyboardDidShow = useCallback(
    event => {
      const newHeight = Math.floor(event.endCoordinates.height);

      if (
        // We don't want to set the height cache when the screen is out of focus.
        isFocused &&
        // Only update if there is no existing height in the cache.
        (!heightForKeyboardType || newHeight !== heightForKeyboardType)
      ) {
        dispatch(
          setKeyboardHeight({
            height: newHeight,
            keyboardType,
          })
        );
        (Keyboard as any).scheduleLayoutAnimation(event);
      }
    },
    [dispatch, heightForKeyboardType, isFocused, keyboardType]
  );

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow);
    return () => {
      Keyboard.removeListener('keyboardDidShow', handleKeyboardDidShow);
    };
  }, [handleKeyboardDidShow]);

  return heightForKeyboardType || cachedKeyboardHeights.default || 0;
}
