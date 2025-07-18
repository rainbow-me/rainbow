import { useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { EmitterSubscription, Keyboard, KeyboardEventListener } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import KeyboardTypes from '@/helpers/keyboardTypes';
import { setKeyboardHeight } from '@/redux/keyboardHeight';
import { AppState } from '@/redux/store';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_ANDROID } from '@/env';

interface UseKeyboardHeightOptions {
  keyboardType?: keyof typeof KeyboardTypes;
  shouldListen?: boolean;
}

const keyboardHeightsSelector = (state: AppState) => state.keyboardHeight.keyboardHeight;

export default function useKeyboardHeight(options: UseKeyboardHeightOptions = {}) {
  // keyboards can different heights depending on whether
  // things like "autofill" or "autocomplete" are enabled on the target input.
  const { keyboardType = KeyboardTypes.default, shouldListen = true } = options;
  const listenerRef = useRef<EmitterSubscription>(undefined);
  const insets = useSafeAreaInsets();
  // Android keyboard height doesn't include the bottom inset.
  const extraHeight = IS_ANDROID ? insets.bottom : 0;

  const dispatch = useDispatch();

  const cachedKeyboardHeights = useSelector(keyboardHeightsSelector);
  const heightForKeyboardType = cachedKeyboardHeights?.[keyboardType as keyof typeof cachedKeyboardHeights];

  const { name: routeName } = useRoute();

  const handleKeyboardDidShow: KeyboardEventListener = useCallback(
    event => {
      const newHeight = Math.floor(event.endCoordinates.height + extraHeight);
      const isRouteActive = useNavigationStore.getState().isRouteActive(routeName);
      if (
        // We don't want to set the height cache when the screen is out of focus.
        isRouteActive &&
        // Only update if there is no existing height in the cache.
        (!heightForKeyboardType || newHeight !== heightForKeyboardType)
      ) {
        dispatch(
          setKeyboardHeight({
            height: newHeight,
            keyboardType: keyboardType as keyof typeof KeyboardTypes,
          })
        );
      }
    },
    [dispatch, heightForKeyboardType, keyboardType, routeName, extraHeight]
  );

  const addListener = useCallback(() => {
    if (listenerRef.current) return;

    listenerRef.current = Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow);
  }, [handleKeyboardDidShow]);

  const removeListener = useCallback(() => {
    if (listenerRef.current === undefined) return;

    listenerRef.current.remove();
    listenerRef.current = undefined;
  }, []);

  useEffect(() => {
    if (shouldListen) {
      addListener();
    } else {
      removeListener();
    }

    return removeListener;
  }, [shouldListen, addListener, removeListener]);

  return heightForKeyboardType || cachedKeyboardHeights.default || 0;
}
