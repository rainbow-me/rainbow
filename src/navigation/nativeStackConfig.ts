import { Keyboard, StatusBar } from 'react-native';
import currentColors from '../context/currentColors';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Navigation' was resolved to '/Users/nick... Remove this comment to see the full error message
import { getActiveRoute, onDidPop, onWillPop } from './Navigation';
import { appearListener } from './nativeStackHelpers';

export const nativeStackConfig = {
  mode: 'modal',
  screenOptions: {
    contentStyle: {
      backgroundColor: 'transparent',
    },
    onAppear: () => {
      // @ts-expect-error ts-migrate(2721) FIXME: Cannot invoke an object which is possibly 'null'.
      appearListener.current && appearListener.current();
    },
    onDismissed: onDidPop,
    onTouchTop: ({ nativeEvent: { dismissing } }: any) => {
      if (dismissing) {
        Keyboard.dismiss();
      } else {
        // @ts-expect-error ts-migrate(2721) FIXME: Cannot invoke an object which is possibly 'null'.
        appearListener.current && appearListener.current();
      }
    },
    onWillDismiss: () => {
      onWillPop();
      if (
        currentColors.theme === 'light' &&
        !getActiveRoute()?.params?.fromDiscover
      ) {
        StatusBar.setBarStyle('dark-content');
      }
    },
    showDragIndicator: false,
    springDamping: 0.8,
    stackPresentation: 'modal',
    transitionDuration: 0.35,
  },
};
