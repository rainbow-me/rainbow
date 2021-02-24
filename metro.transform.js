/* eslint-disable import/no-commonjs */
const { merge } = require('lodash');
const { transform } = require('metro-plugin-anisotropic-transform');

module.exports.transform = function applyRainbowTransform({
  src,
  filename,
  options,
}) {
  const opts = merge(options, {
    customTransformOptions: {
      'metro-plugin-anisotropic-transform': {
        globalScopeFilter: {
          '@react-native-community/clipboard': {},
          'react-native-keychain': {},
        },
        madge: {
          tsConfig: require.resolve('./tsconfig.json'),
        },
      },
    },
  });
  return transform({ filename, options: opts, src });
};
