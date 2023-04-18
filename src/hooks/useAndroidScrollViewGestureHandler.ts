import { NavigationProp } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { useNavigation } from '../navigation';

/**
 * This is a pretty hacky fix for getting a `Stack` that consists of bottom
 * sheet configuration to work nicely with scroll views on Android.
 */
export default function useAndroidScrollViewGestureHandler({
  navigation: navigationOverride,
}: {
  navigation?: NavigationProp<any, any>;
} = {}) {
  const inferredNavigation = useNavigation();
  const navigation = navigationOverride || inferredNavigation;

  const gestureEnabled = useRef(true);
  const onScroll = useCallback(
    ({ nativeEvent }) => {
      if (!android) return;
      if (nativeEvent.contentOffset.y <= 0 && !gestureEnabled.current) {
        navigation.setOptions({ gestureEnabled: true });
        gestureEnabled.current = true;
      }
      if (nativeEvent.contentOffset.y > 0 && gestureEnabled.current) {
        navigation.setOptions({ gestureEnabled: false });
        gestureEnabled.current = false;
      }
    },
    [navigation]
  );

  return { onScroll };
}
