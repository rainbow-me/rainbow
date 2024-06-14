import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import '@ethersproject/shims';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNative from 'react-native';
import Storage from 'react-native-storage';
// import { debugLayoutAnimations } from './src/config/debug';
import { mmkvStorageBackend } from '@/handlers/localstorage/mmkvStorageBackend';
import logger from '@/utils/logger';
import 'fast-text-encoding';
import globalVariables from './globalVariables';

if (typeof BigInt === 'undefined') global.BigInt = require('big-integer');

if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return new Buffer(str, 'binary').toString('base64');
  };
}

if (typeof atob === 'undefined') {
  global.atob = function (b64Encoded) {
    return new Buffer(b64Encoded, 'base64').toString('binary');
  };
}

// https://github.com/facebook/react-native/commit/1049835b504cece42ee43ac5b554687891da1349
// https://github.com/facebook/react-native/commit/035718ba97bb44c68f2a4ccdd95e537e3d28690
if (ReactNative.Keyboard.removeEventListener) {
  ReactNative.Keyboard.removeListener = ReactNative.Keyboard.removeEventListener;
}

const storage = new Storage({
  defaultExpires: null,
  size: 10000,
  // TODO (RNBW-3969): Migrate to mmkv on iOS too
  storageBackend: ReactNative.Platform.OS === 'ios' ? AsyncStorage : mmkvStorageBackend,
});

if (ReactNative.Platform.OS === 'android') {
  ReactNative.UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

global.storage = storage;

for (const [key, value] of Object.entries(globalVariables)) {
  Object.defineProperty(global, key, {
    get: () => value,
    set: () => {
      logger.sentry(`Trying to override internal Rainbow var ${key}`);
    },
  });
}

const SHORTEN_PROP_TYPES_ERROR = true;

if (SHORTEN_PROP_TYPES_ERROR) {
  const oldConsoleError = console.error; // eslint-disable-line no-console
  // eslint-disable-next-line no-console
  console.error = function () {
    if (typeof arguments[0] === 'string' && arguments[0].startsWith('Warning: Failed prop type')) {
      // eslint-disable-next-line no-console
      console.log(
        `PropTypes error in: ${arguments[0]
          .match(/\w+.js:[0-9]+/g)
          .slice(0, 6)
          .join(' in ')}`
      );
      return;
    }
    if (typeof arguments[0] === 'string' && arguments[0].startsWith('VirtualizedLists should never be nested inside plain ScrollViews')) {
      return;
    }
    oldConsoleError?.apply(this, arguments);
  };
}
if (typeof __dirname === 'undefined') global.__dirname = '/';
if (typeof __filename === 'undefined') global.__filename = '';
if (typeof process === 'undefined') {
  global.process = require('process');
} else {
  const bProcess = require('process');
  for (const p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p];
    }
  }
}

export const dismissingScreenListener = { current: undefined };

global.__rainbowDismissScreen = () => dismissingScreenListener.current?.();

process.browser = false;
if (typeof Buffer === 'undefined') global.Buffer = require('buffer').Buffer;
// global.location = global.location || { port: 80 }
const isDev = typeof __DEV__ === 'boolean' && __DEV__;
process.env.NODE_ENV = isDev ? 'development' : 'production';
if (typeof localStorage !== 'undefined') {
  localStorage.debug = isDev ? '*' : '';
}

ReactNative.LayoutAnimation.configureNext = () => null;
// const oldConfigureNext = ReactNative.LayoutAnimation.configureNext;

// if (
//   !ReactNative.LayoutAnimation.configureNext.__shimmed &&
//   debugLayoutAnimations
// ) {
//   ReactNative.LayoutAnimation.configureNext = (...args) => {
//     logger.sentry('LayoutAnimation.configureNext', args);
//     oldConfigureNext(...args);
//   };
//   ReactNative.LayoutAnimation.configureNext.__shimmed = true;
// }

if (!ReactNative.InteractionManager._shimmed) {
  const oldCreateInteractionHandle = ReactNative.InteractionManager.createInteractionHandle;

  ReactNative.InteractionManager.createInteractionHandle = function (finishAutomatically = true) {
    const handle = oldCreateInteractionHandle();
    if (finishAutomatically) {
      setTimeout(() => {
        ReactNative.InteractionManager.clearInteractionHandle(handle);
        logger.sentry(`Interaction finished automatically`);
      }, 3000);
    }
    return handle;
  };

  ReactNative.InteractionManager._shimmed = true;
}

// If using the crypto shim, uncomment the following line to ensure
// crypto is loaded first, so it can populate global.crypto
// eslint-disable-next-line import/no-commonjs
require('crypto');

const description = Object.getOwnPropertyDescriptor(ReactNative, 'requireNativeComponent');

if (!description.writable) {
  Object.defineProperty(ReactNative, 'requireNativeComponent', {
    value: (function () {
      const cache = {};
      const _requireNativeComponent = ReactNative.requireNativeComponent;

      return function requireNativeComponent(nativeComponent) {
        if (!cache[nativeComponent]) {
          cache[nativeComponent] = _requireNativeComponent(nativeComponent);
        }

        return cache[nativeComponent];
      };
    })(),
    writable: true,
  });
}
