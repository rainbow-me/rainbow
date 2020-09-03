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
