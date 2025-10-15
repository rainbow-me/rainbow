import { combineReducers } from 'redux';

import charts from './charts';
import contacts from './contacts';

import editOptions from './editOptions';
import ensRegistration from './ensRegistration';
import gas from './gas';
import imageMetadata from './imageMetadata';
import keyboardHeight from './keyboardHeight';
import transactionSignatures from './transactionSignatures';

export default combineReducers({
  charts,
  contacts,
  editOptions,
  ensRegistration,
  gas,
  imageMetadata,
  keyboardHeight,
  transactionSignatures,
});
