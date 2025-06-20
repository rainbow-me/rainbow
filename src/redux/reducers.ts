import { combineReducers } from 'redux';

import charts from './charts';
import contacts from './contacts';

import editOptions from './editOptions';
import ensRegistration from './ensRegistration';
import gas from './gas';
import hiddenTokens from './hiddenTokens';
import imageMetadata from './imageMetadata';
import keyboardHeight from './keyboardHeight';
import settings from './settings';
import showcaseTokens from './showcaseTokens';
import transactionSignatures from './transactionSignatures';

export default combineReducers({
  charts,
  contacts,
  editOptions,
  ensRegistration,
  gas,
  hiddenTokens,
  imageMetadata,
  keyboardHeight,
  settings,
  showcaseTokens,
  transactionSignatures,
});
