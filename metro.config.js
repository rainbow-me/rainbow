// eslint-disable-next-line import/no-extraneous-dependencies
const blacklist = require('metro-config/src/defaults/blacklist');

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

module.exports = {
  resolver: {
    blacklistRE,
  },
  transformer: {
    babelTransformerPath: require.resolve('./metro.transform.js'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: true,
      },
    }),
  },
};
