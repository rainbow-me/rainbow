require('dotenv/config');

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

const createTransformer = ({ applyMetroTransform }) => {
  const common = {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: true,
      },
    }),
  };
  if (applyMetroTransform) {
    return {
      ...common,
      babelTransformerPath: require.resolve('./metro.transform.js'),
    };
  }
  return common;
};

const { CI } = process.env;

module.exports = {
  resolver: {
    blacklistRE,
  },
  transformer: createTransformer({
    applyMetroTransform: !!CI,
  }),
};
