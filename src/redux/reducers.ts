import { combineReducers } from 'redux';

import appState from './appState';
import charts from './charts';
import contacts from './contacts';

import editOptions from './editOptions';
import ensRegistration from './ensRegistration';
import explorer from './explorer';
import gas from './gas';
import hiddenTokens from './hiddenTokens';
import imageMetadata from './imageMetadata';
import keyboardHeight from './keyboardHeight';
import requests from './requests';
import settings from './settings';
import showcaseTokens from './showcaseTokens';
import swap from './swap';
import transactionSignatures from './transactionSignatures';
import walletconnect from './walletconnect';
import wallets from './wallets';

export default combineReducers({
  appState,
  charts,
  contacts,
  editOptions,
  ensRegistration,
  explorer,
  gas,
  hiddenTokens,
  imageMetadata,
  keyboardHeight,
  requests,
  settings,
  showcaseTokens,
  swap,
  transactionSignatures,
  walletconnect,
  wallets,
});
