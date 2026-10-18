import { Keyboard } from 'react-native';

import { type NativeStackOptions } from '@/react-native-cool-modals/types';

import { appearListener } from './nativeStackHelpers';
import { onDidPop } from './Navigation';

export const nativeStackConfig: { screenOptions: NativeStackOptions } = {
  screenOptions: {
    contentStyle: {
      backgroundColor: 'transparent',
    },
    onAppear: () => {
      appearListener.current && appearListener.current();
    },
    onDismissed: onDidPop,
    onTouchTop: ({ nativeEvent: { dismissing } }: { nativeEvent: { dismissing: boolean } }) => {
      if (dismissing) {
        Keyboard.dismiss();
      } else {
        appearListener.current && appearListener.current();
      }
    },
    springDamping: 0.8,
    stackPresentation: 'modal',
    transitionDuration: 0.35,
  },
};
