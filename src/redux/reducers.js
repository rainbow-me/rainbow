import { combineReducers } from 'redux';

import actionSheetManager from './actionSheetManager';
import addCash from './addCash';
import charts from './charts';
import contacts from './contacts';
import data from './data';
import editOptions from './editOptions';
import explorer from './explorer';
import gas from './gas';
import imageDimensionsCache from './imageDimensionsCache';
import keyboardHeight from './keyboardHeight';
import navigation from './navigation';
import nonce from './nonce';
import openStateSettings from './openStateSettings';
import raps from './raps';
import requests from './requests';
import savings from './savings';
import selectedInput from './selectedInput';
import selectedWithFab from './selectedWithFab';
import settings from './settings';
import showcaseTokens from './showcaseTokens';
import uniqueTokens from './uniqueTokens';
import uniswap from './uniswap';
import walletconnect from './walletconnect';

export default combineReducers({
  actionSheetManager,
  addCash,
  charts,
  contacts,
  data,
  editOptions,
  explorer,
  gas,
  imageDimensionsCache,
  keyboardHeight,
  navigation,
  nonce,
  openStateSettings,
  raps,
  requests,
  savings,
  selectedInput,
  selectedWithFab,
  settings,
  showcaseTokens,
  uniqueTokens,
  uniswap,
  walletconnect,
});
