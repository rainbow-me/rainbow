import { Keyboard } from 'react-native';

import { type CoolModalNavigationOptions } from '@/react-native-cool-modals/NativeStackView';

import { appearListener } from './nativeStackHelpers';
import { onDidPop, onWillPop } from './Navigation';

type NativeStackConfig = {
  screenOptions: CoolModalNavigationOptions;
};

export const nativeStackConfig: NativeStackConfig = {
  screenOptions: {
    contentStyle: {
      backgroundColor: 'transparent',
    },
    onAppear: () => {
      appearListener.current?.();
    },
    onDismissed: onDidPop,
    onTouchTop: ({ nativeEvent: { dismissing } }) => {
      if (dismissing) {
        Keyboard.dismiss();
      } else {
        appearListener.current?.();
      }
    },
    onWillDismiss: onWillPop,
    showDragIndicator: false,
    springDamping: 0.8,
    stackPresentation: 'modal',
    transitionDuration: 0.35,
  },
};
