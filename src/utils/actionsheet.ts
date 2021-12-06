import { ActionSheetIOS } from 'react-native';
import ActionSheet from 'react-native-action-sheet';

export default function showActionSheetWithOptions(...args: any[]) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  if (ios) {
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 2 arguments, but got 0 or more.
    ActionSheetIOS.showActionSheetWithOptions(...args);
  } else {
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 2 arguments, but got 0 or more.
    ActionSheet.showActionSheetWithOptions(...args);
  }
}
