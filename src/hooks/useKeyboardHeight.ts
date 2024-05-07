import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { EmitterSubscription, Keyboard, KeyboardEventListener } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import KeyboardTypes from '@/helpers/keyboardTypes';
import { setKeyboardHeight } from '@/redux/keyboardHeight';
import { AppState } from '@/redux/store';

interface UseKeyboardHeightOptions {
  keyboardType?: keyof typeof KeyboardTypes;
  shouldListen?: boolean;
}

const keyboardHeightsSelector = (state: AppState) => state.keyboardHeight.keyboardHeight;

export default function useKeyboardHeight(options: UseKeyboardHeightOptions = {}) {
  // keyboards can different heights depending on whether
  // things like "autofill" or "autocomplete" are enabled on the target input.
  const { keyboardType = KeyboardTypes.default, shouldListen = true } = options;
  const listenerRef = useRef<EmitterSubscription>();

  const dispatch = useDispatch();

  const cachedKeyboardHeights = useSelector(keyboardHeightsSelector);
  const heightForKeyboardType = cachedKeyboardHeights?.[keyboardType as keyof typeof cachedKeyboardHeights];

  const isFocused = useIsFocused();

  const handleKeyboardDidShow: KeyboardEventListener = useCallback(
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
            keyboardType: keyboardType as keyof typeof KeyboardTypes,
          })
        );
        Keyboard.scheduleLayoutAnimation(event);
      }
    },
    [dispatch, heightForKeyboardType, isFocused, keyboardType]
  );

  useEffect(() => {
    if (shouldListen) {
      listenerRef.current = Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow);
      return () => {
        listenerRef.current?.remove();
      };
    }
  }, [handleKeyboardDidShow, shouldListen]);

  return heightForKeyboardType || cachedKeyboardHeights.default || 0;
}
