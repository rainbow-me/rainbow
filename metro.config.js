// eslint-disable-next-line import/no-extraneous-dependencies
const blacklist = require('metro-config/src/defaults/exclusionList');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Deny list is a function that takes an array of regexes and combines
// them with the default blacklist to return a single regex.
const blacklistRE = blacklist([
  // react-native-animated-charts
  /src\/react-native-animated-charts\/Example\/.*/,
  /src\/react-native-animated-charts\/node_modules\/.*/,
  'src.react-native-animated-charts.package.json',
  // react-native-reanimated <patch>
  /patches\/reanimated\/.*/,
]);

const transformer = {
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: true,
      inlineRequires: true,
    },
  }),
};

// Only run metro transforms on CI
if (process.env.CI) {
  transformer.babelTransformerPath = require.resolve('./metro.transform.js');
}

const rainbowConfig = {
  resolver: {
    blacklistRE,
  },
  transformer,
};
module.exports = mergeConfig(getDefaultConfig(__dirname), rainbowConfig);
