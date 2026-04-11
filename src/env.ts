import ReactNative, { NativeModules } from 'react-native';

import { getInstallerPackageNameSync } from 'react-native-device-info';
import { ENABLE_DEV_MODE, IS_TESTING, RPC_PROXY_API_KEY_PROD, RPC_PROXY_BASE_URL_PROD } from 'react-native-dotenv';

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

export const RPC_PROXY_BASE_URL = RPC_PROXY_BASE_URL_PROD;
export const RPC_PROXY_API_KEY = RPC_PROXY_API_KEY_PROD;

export const IS_TEST_FLIGHT = IS_IOS && getInstallerPackageNameSync() === 'TestFlight';

// TODO: Replace IS_STORE_INSTALL with DANGER_INSTALL_SOURCE (renamed to INSTALL_SOURCE) once verified in production.
// The AppInstallInfo native module is shipped but not wired in yet. DANGER_INSTALL_SOURCE
// reads from the new native module for observation/verification only. Do NOT use it for
// gating features or behavior until the values have been confirmed across all build types.
export const IS_STORE_INSTALL = !IS_DEV && !IS_TEST_FLIGHT;
export const IS_INTERNAL = IS_DEV || !IS_STORE_INSTALL;

export type InstallSource = 'store' | 'internal' | 'dev';
export const DANGER_INSTALL_SOURCE: InstallSource = IS_DEV ? 'dev' : NativeModules.AppInstallInfo.isStoreInstall() ? 'store' : 'internal';
