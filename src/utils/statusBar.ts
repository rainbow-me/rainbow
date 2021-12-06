import { debounce } from 'lodash';
import { StatusBar } from 'react-native';

export const setBarStyle = debounce((...args) => {
  // @ts-expect-error ts-migrate(2556) FIXME: Expected 1-2 arguments, but got 0 or more.
  StatusBar.setBarStyle(...args);
}, 100);

export default {
  setBarStyle,
};
