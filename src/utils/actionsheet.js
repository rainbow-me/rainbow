import { ActionSheetIOS } from 'react-native';
import ActionSheet from 'react-native-action-sheet';

export default function showActionSheetWithOptions(...args) {
  if (ios) {
    ActionSheetIOS.showActionSheetWithOptions(...args);
  } else {
    ActionSheet.showActionSheetWithOptions(...args);
  }
}
