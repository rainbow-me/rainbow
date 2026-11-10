import { combineReducers } from 'redux';

import gas from '@/features/gas/redux/gas';

import charts from './charts';
import contacts from './contacts';
import editOptions from './editOptions';
import imageMetadata from './imageMetadata';
import keyboardHeight from './keyboardHeight';
import settings from './settings';
import transactionSignatures from './transactionSignatures';

export default combineReducers({
  charts,
  contacts,
  editOptions,
  gas,
  imageMetadata,
  keyboardHeight,
  settings,
  transactionSignatures,
});
