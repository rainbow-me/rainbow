import { Platform } from 'react-native';

export default Platform.select({
  ios: require('./Routes.ios'),
  android: require('./Routes.android'),
});
