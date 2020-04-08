import { ActionSheetIOS, Platform } from 'react-native';
import { logger } from '../utils';

export function showActionSheetWithOptions(...args) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(...args);
  } else {
    logger.log('Actionsheet not implemented for:', Platform.OS);
  }
}

export default {
  showActionSheetWithOptions,
};
