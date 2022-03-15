import { Keyboard } from 'react-native';
import { onDidPop, onWillPop } from './Navigation';
import { appearListener } from './nativeStackHelpers';

export const nativeStackConfig = {
  mode: 'modal',
  screenOptions: {
    contentStyle: {
      backgroundColor: 'transparent',
    },
    onAppear: () => {
      appearListener.current && appearListener.current();
    },
    onDismissed: onDidPop,
    onTouchTop: ({ nativeEvent: { dismissing } }) => {
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
