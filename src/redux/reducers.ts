import { combineReducers } from 'redux';

import ensRegistration from '@/features/ens/redux/registration';

import charts from './charts';
import contacts from './contacts';
import editOptions from './editOptions';
import gas from './gas';
import imageMetadata from './imageMetadata';
import keyboardHeight from './keyboardHeight';
import settings from './settings';
import transactionSignatures from './transactionSignatures';

export default combineReducers({
  charts,
  contacts,
  editOptions,
  ensRegistration,
  gas,
  imageMetadata,
  keyboardHeight,
  settings,
  transactionSignatures,
});
