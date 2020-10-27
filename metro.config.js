// eslint-disable-next-line import/no-extraneous-dependencies
const blacklist = require('metro-config/src/defaults/blacklist');

// Denylist is a function that takes an array of regexes and combines
// them with the default blacklist to return a single regex.

const RNACBL = [
  /src\/react-native-animated-charts\/Example\/.*/,
  /src\/react-native-animated-charts\/node_modules\/.*/,
  'src.react-native-animated-charts.package.json',
];

const REAPATCH = [/patches\/reanimated\/.*/];

module.exports = {
  resolver: {
    blacklistRE: blacklist([...RNACBL, ...REAPATCH]),
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
