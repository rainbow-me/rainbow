import { useLayoutEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import { useNavigation } from './Navigation';

export default function useStatusBarManaging() {
  const navigation = useNavigation();
  const ref = useRef();
  useLayoutEffect(() => {
    const unsubscribe = navigation.addListener('transitionStart', ({ data: { closing } }) => {
      if (closing) {
        StatusBar.popStackEntry(ref.current);
      } else {
        ref.current = StatusBar.pushStackEntry({
          animated: true,
          barStyle: 'light-content',
        });
      }
    });

    return unsubscribe;
  }, [navigation]);
}
