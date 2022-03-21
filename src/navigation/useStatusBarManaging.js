import { useLayoutEffect, useRef } from 'react';
import { StatusBarService } from '../services';
import { useNavigation } from './Navigation';

export default function useStatusBarManaging() {
  const navigation = useNavigation();
  const ref = useRef();
  useLayoutEffect(() => {
    const unsubscribe = navigation.addListener(
      'transitionStart',
      ({ data: { closing } }) => {
        if (closing) {
          StatusBarService.popStackEntry(ref.current);
        } else {
          ref.current = StatusBarService.pushStackEntry({
            animated: true,
            barStyle: 'light-content',
          });
        }
      }
    );

    return unsubscribe;
  }, [navigation]);
}
