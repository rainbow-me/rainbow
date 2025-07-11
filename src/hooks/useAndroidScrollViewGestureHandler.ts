import { useCallback, useRef } from 'react';
import { Navigation, useNavigation } from '@/navigation';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * This is a pretty hacky fix for getting a `Stack` that consists of bottom
 * sheet configuration to work nicely with scroll views on Android.
 */
export default function useAndroidScrollViewGestureHandler() {
  const { setOptions } = useNavigation();
  const gestureEnabled = useRef(true);
  const onScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!android) return;
      if (nativeEvent.contentOffset.y <= 0 && !gestureEnabled.current) {
        setOptions({ gestureEnabled: true });
        gestureEnabled.current = true;
      }
      if (nativeEvent.contentOffset.y > 0 && gestureEnabled.current) {
        setOptions({ gestureEnabled: false });
        gestureEnabled.current = false;
      }
    },
    [setOptions]
  );

  return { onScroll };
}
