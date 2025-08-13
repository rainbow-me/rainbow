import { Keyboard } from 'react-native';
import { onDidPop, onWillPop } from './Navigation';
import { appearListener } from './nativeStackHelpers';

type NativeStackConfig = {
  mode: 'modal';
  screenOptions: {
    contentStyle: {
      backgroundColor: string;
    };
    onAppear: () => void;
    onDismissed: () => void;
    onTouchTop: ({ nativeEvent: { dismissing } }: { nativeEvent: { dismissing: boolean } }) => void;
    onWillDismiss: () => void;
    showDragIndicator: boolean;
    springDamping: number;
    stackPresentation: 'modal';
    transitionDuration: number;
  };
};

export const nativeStackConfig: NativeStackConfig = {
  mode: 'modal',
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
    onWillDismiss: onWillPop,
    showDragIndicator: false,
    springDamping: 0.8,
    stackPresentation: 'modal',
    transitionDuration: 0.35,
  },
};
