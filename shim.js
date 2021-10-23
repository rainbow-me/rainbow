import 'react-native-get-random-values';
import '@ethersproject/shims';
import AsyncStorage from '@react-native-community/async-storage';
import ReactNative from 'react-native';
import Animated from 'react-native-reanimated';
import Storage from 'react-native-storage';
// import { debugLayoutAnimations } from './src/config/debug';
import toLocaleStringPolyfill from '@rainbow-me/helpers/toLocaleStringPolyfill';
import logger from 'logger';

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

toLocaleStringPolyfill();

ReactNative.Platform.OS === 'ios' &&
  Animated.addWhitelistedNativeProps({ d: true });

const storage = new Storage({
  defaultExpires: null,
  enableCache: ReactNative.Platform.OS === 'ios',
  size: 10000,
  storageBackend: AsyncStorage,
});

if (ReactNative.Platform.OS === 'android') {
  ReactNative.UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

if (
  !global.__reanimatedModuleProxy &&
  !ReactNative.TurboModuleRegistry.get('NativeReanimated')
) {
  global.__reanimatedModuleProxy = {
    __shimmed: true,
    installCoreFunctions() {},
    makeMutable(init) {
      return { value: init };
    },
    makeRemote() {},
    makeShareable() {
      return () => {};
    },
    registerEventHandler() {},
    startMapper() {},
    stopMapper() {},
    unregisterEventHandler() {},
  };
}

global.storage = storage;

// shimming for reanimated need to happen before importing globalVariables.js
// eslint-disable-next-line import/no-commonjs
for (let variable of Object.entries(require('./globalVariables').default)) {
  Object.defineProperty(global, variable[0], {
    get: () => variable[1],
    set: () => {
      logger.sentry(`Trying to override internal Rainbow var ${variable[0]}`);
    },
  });
}

const SHORTEN_PROP_TYPES_ERROR = true;

if (SHORTEN_PROP_TYPES_ERROR) {
  const oldConsoleError = console.error; // eslint-disable-line no-console
  // eslint-disable-next-line no-console
  console.error = function () {
    if (
      typeof arguments[0] === 'string' &&
      arguments[0].startsWith('Warning: Failed prop type')
    ) {
      // eslint-disable-next-line no-console
      console.log(
        `PropTypes error in: ${arguments[0]
          .match(/\w+.js:[0-9]+/g)
          .slice(0, 6)
          .join(' in ')}`
      );
      return;
    }
    if (
      typeof arguments[0] === 'string' &&
      arguments[0].startsWith(
        'VirtualizedLists should never be nested inside plain ScrollViews'
      )
    ) {
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
  for (var p in bProcess) {
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
  const oldCreateInteractionHandle =
    ReactNative.InteractionManager.createInteractionHandle;

  ReactNative.InteractionManager.createInteractionHandle = function (
    finishAutomatically = true
  ) {
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

const description = Object.getOwnPropertyDescriptor(
  ReactNative,
  'requireNativeComponent'
);

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
