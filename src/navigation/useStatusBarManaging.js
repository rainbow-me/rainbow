import { useLayoutEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import { Navigation } from './Navigation';

export default function useStatusBarManaging() {
  const ref = useRef();
  useLayoutEffect(() => {
    const unsubscribe = Navigation.addListener('transitionStart', ({ data: { closing } }) => {
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
  }, []);
}
