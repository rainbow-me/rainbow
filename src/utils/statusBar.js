import _ from 'lodash';
import { StatusBar } from 'react-native';

export const setBarStyle = _.debounce((...args) => {
  StatusBar.setBarStyle(...args);
}, 100);

export default {
  setBarStyle,
};
