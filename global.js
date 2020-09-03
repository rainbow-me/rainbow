import { ENABLE_DEV_MODE } from 'react-native-dotenv';

if (typeof btoa === 'undefined') {
  global.btoa = function(str) {
    return new Buffer(str, 'binary').toString('base64');
  };
}

if (typeof atob === 'undefined') {
  global.atob = function(b64Encoded) {
    return new Buffer(b64Encoded, 'base64').toString('binary');
  };
}

global.IS_DEV =
  (typeof __DEV__ === 'boolean' && __DEV__) || !!Number(ENABLE_DEV_MODE);
