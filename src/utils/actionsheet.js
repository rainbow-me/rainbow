import { ActionSheetIOS, Platform } from 'react-native';

export function showActionSheetWithOptions(...args) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(...args);
  } else {
    console.log('Actionsheet not implemented for:', Platform.OS);
  }
}

export default {
  showActionSheetWithOptions,
};
