import { Alert, AlertButton, AlertOptions, ToastAndroid } from 'react-native';

const WrapperAlert = {
  ...Alert,
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    if (android && !buttons && !options) {
      const text = message ? `${title}\n${message}` : title;
      ToastAndroid.show(text, ToastAndroid.SHORT);
    } else {
      return Alert.alert(title, message, buttons, options);
    }
  },
} as typeof Alert;

export default WrapperAlert;
