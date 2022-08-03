import { Alert, AlertButton, AlertOptions, ToastAndroid } from 'react-native';

const WrapperAlert = {
  ...Alert,
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    if (
      android &&
      message === undefined &&
      buttons === undefined &&
      options === undefined
    ) {
      ToastAndroid.show(title, ToastAndroid.SHORT);
    } else {
      return Alert.alert(title, message, buttons, options);
    }
  },
} as typeof Alert;

export default WrapperAlert;
