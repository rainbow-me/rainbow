import { IS_IOS } from '@/env';
import { ActionSheetIOS, ActionSheetIOSOptions } from 'react-native';
import ActionSheet from 'react-native-action-sheet';

export default function showActionSheetWithOptions(options: ActionSheetIOSOptions, callback: (buttonIndex: number | undefined) => void) {
  if (IS_IOS) {
    ActionSheetIOS.showActionSheetWithOptions(options, callback);
  } else {
    ActionSheet.showActionSheetWithOptions(options, callback);
  }
}
