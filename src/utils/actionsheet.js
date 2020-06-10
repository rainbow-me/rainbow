import { ActionSheetIOS, Platform } from 'react-native';
import ActionSheet from 'react-native-action-sheet';

export function showActionSheetWithOptions(...args) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(...args);
  } else {
    ActionSheet.showActionSheetWithOptions(...args);
  }
}

export default {
  showActionSheetWithOptions,
};
