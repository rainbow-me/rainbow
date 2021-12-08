import { debounce } from 'lodash';
import { StatusBar } from 'react-native';

export const setBarStyle = debounce((...args) => {
  StatusBar.setBarStyle(...args);
}, 100);

export default {
  setBarStyle,
};
