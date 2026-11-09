import { combineReducers } from 'redux';

import gas from '@/features/gas/redux/gas';

import contacts from './contacts';
import imageMetadata from './imageMetadata';
import keyboardHeight from './keyboardHeight';
import settings from './settings';

export default combineReducers({
  contacts,
  gas,
  imageMetadata,
  keyboardHeight,
  settings,
});
