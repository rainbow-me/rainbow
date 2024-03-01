import ReactNative from 'react-native';
import {
  ENABLE_DEV_MODE,
  IS_TESTING,
  RPC_PROXY_BASE_URL_PROD,
  RPC_PROXY_BASE_URL_DEV,
  RPC_PROXY_API_KEY_PROD,
  RPC_PROXY_API_KEY_DEV,
} from 'react-native-dotenv';

/**
 * @deprecated use IS_ANDROID
 */
export const android = ReactNative.Platform.OS === 'android';
export const IS_ANDROID = android;
/**
 * @deprecated use IS_IOS
 */
export const ios = ReactNative.Platform.OS === 'ios';
export const IS_IOS = ios;
/**
 * @deprecated use IS_WEB
 */
export const web = ReactNative.Platform.OS === 'web';
export const IS_WEB = web;

export const IS_DEV = (typeof __DEV__ === 'boolean' && __DEV__) || !!Number(ENABLE_DEV_MODE);
export const IS_TEST = IS_TESTING === 'true';
export const IS_PROD = !IS_DEV && !IS_TEST;

export const RPC_PROXY_BASE_URL = IS_PROD ? RPC_PROXY_BASE_URL_PROD : RPC_PROXY_BASE_URL_DEV;
export const RPC_PROXY_API_KEY = IS_PROD ? RPC_PROXY_API_KEY_PROD : RPC_PROXY_API_KEY_DEV;
