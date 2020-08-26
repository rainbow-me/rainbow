// eslint-disable-next-line import/no-extraneous-dependencies
const blacklist = require('metro-config/src/defaults/blacklist');

// blacklist is a function that takes an array of regexes and combines
// them with the default blacklist to return a single regex.

const RNACBL = [
  /src\/react-native-animated-charts\/Example\/.*/,
  /src\/react-native-animated-charts\/node_modules\/.*/,
  'src.react-native-animated-charts.package.json',
];

module.exports = {
  resolver: {
    blacklistRE: blacklist([...RNACBL]),
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: true,
      },
    }),
  },
};
