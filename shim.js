import AsyncStorage from '@react-native-community/async-storage';
// eslint-disable-next-line import/default
import ReactNative from 'react-native';
import Storage from 'react-native-storage';

const storage = new Storage({
  defaultExpires: null,
  enableCache: true,
  size: 10000,
  storageBackend: AsyncStorage,
});

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
    makeShareable() {},
    startMapper() {},
    stopMapper() {},
  };
}

global.storage = storage;

const SHORTEN_PROP_TYPES_ERROR = true;

if (SHORTEN_PROP_TYPES_ERROR) {
  const oldConsoleError = console.error;
  console.error = function() {
    if (
      typeof arguments[0] === 'string' &&
      arguments[0].startsWith('Warning: Failed prop type')
    ) {
      console.log(
        `PropTypes error in: ${arguments[0]
          .match(/\w+.js:[0-9]+/g)
          .slice(0, 6)
          .join(' in ')}`
      );
      return;
    }
    oldConsoleError.apply(this, arguments);
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

process.browser = false;
if (typeof Buffer === 'undefined') global.Buffer = require('buffer').Buffer;
// global.location = global.location || { port: 80 }
const isDev = typeof __DEV__ === 'boolean' && __DEV__;
process.env.NODE_ENV = isDev ? 'development' : 'production';
if (typeof localStorage !== 'undefined') {
  localStorage.debug = isDev ? '*' : '';
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
    value: (function() {
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
