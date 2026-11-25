import { combineReducers } from 'redux';

import gas from '@/features/gas/redux/gas';

import contacts from './contacts';
import imageMetadata from './imageMetadata';
import keyboardHeight from './keyboardHeight';

export default combineReducers({
  contacts,
  gas,
  imageMetadata,
  keyboardHeight,
});
