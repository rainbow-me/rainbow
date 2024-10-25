import { combineReducers } from 'redux';

import appState from './appState';
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
import wallets from './wallets';

export default combineReducers({
  appState,
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
  wallets,
});
