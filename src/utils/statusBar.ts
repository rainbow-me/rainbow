import debounce from 'lodash.debounce';
import { StatusBar } from 'react-native';

export const setBarStyle = debounce((...args) => {
  // @ts-ignore
  StatusBar.setBarStyle(...args);
}, 100);

export default {
  setBarStyle,
};
