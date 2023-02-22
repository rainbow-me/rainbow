import { Alert, AlertButton, AlertOptions, ToastAndroid } from 'react-native';
// @ts-ignore
import { IS_TESTING } from 'react-native-dotenv';

const WrappedAlert = {
  ...Alert,
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    if (android && !buttons && !options && IS_TESTING === 'false') {
      const text = message ? `${title}\n${message}` : title;
      ToastAndroid.show(text, ToastAndroid.SHORT);
    } else {
      return Alert.alert(title, message, buttons, options);
    }
  },
} as typeof Alert;

export { WrappedAlert };
