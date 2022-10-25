import { ActionSheetIOS } from 'react-native';
import ActionSheet from 'react-native-action-sheet';

export default function showActionSheetWithOptions(...args: any[]) {
  if (ios) {
    //@ts-ignore
    ActionSheetIOS.showActionSheetWithOptions(...args);
  } else {
    //@ts-ignore
    ActionSheet.showActionSheetWithOptions(...args);
  }
}
