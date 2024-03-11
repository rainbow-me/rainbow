/* eslint-disable import/no-commonjs */
const { merge } = require('lodash');
const { transform } = require('metro-plugin-anisotropic-transform');

module.exports.transform = function applyRainbowTransform({ src, filename, options }) {
  const opts = merge(options, {
    customTransformOptions: {
      'metro-plugin-anisotropic-transform': {
        cyclicDependents: /.+\/node_modules\/react-native\/Libraries\/BatchedBridge\/NativeModules\.js$/,
        globalScopeFilter: {
          '@react-native-clipboard/clipboard': {},
          'react-native-keychain': {},
          'react-native-video': {},
          'react-native-webview': {
            exceptions: ['@ratio.me/ratio-react-native-library'],
          },
        },
        madge: {
          tsConfig: require.resolve('./tsconfig.json'),
        },
      },
    },
  });
  return transform({ filename, options: opts, src });
};
