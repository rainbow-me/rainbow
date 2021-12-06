import { useLayoutEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Navigation' was resolved to '/Users/nick... Remove this comment to see the full error message
import { useNavigation } from './Navigation';

export default function useStatusBarManaging() {
  const navigation = useNavigation();
  const ref = useRef();
  useLayoutEffect(() => {
    const unsubscribe = navigation.addListener(
      'transitionStart',
      ({ data: { closing } }: any) => {
        if (closing) {
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
          StatusBar.popStackEntry(ref.current);
        } else {
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'StatusBarProps' is not assignable to type 'u... Remove this comment to see the full error message
          ref.current = StatusBar.pushStackEntry({
            animated: true,
            barStyle: 'light-content',
          });
        }
      }
    );

    return unsubscribe;
  }, [navigation]);
}
