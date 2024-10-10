// eslint-disable-next-line import/no-extraneous-dependencies
const blacklist = require('metro-config/src/defaults/exclusionList');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

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
    resolveRequest: (context, moduleName, platform) => {
      try {
        return context.resolveRequest(context, moduleName, platform);
      } catch (error) {
        console.warn('\n1️⃣ context.resolveRequest cannot resolve: ', moduleName);
      }

      try {
        const resolution = require.resolve(moduleName, {
          paths: [path.dirname(context.originModulePath), ...config.resolver.nodeModulesPaths],
        });

        if (path.isAbsolute(resolution)) {
          return {
            filePath: resolution,
            type: 'sourceFile',
          };
        }
      } catch (error) {
        console.warn('\n2️⃣ require.resolve cannot resolve: ', moduleName);
      }

      try {
        return defaultModuleResolver(context, moduleName, platform);
      } catch (error) {
        console.warn('\n3️⃣ defaultModuleResolver cannot resolve: ', moduleName);
      }

      try {
        return {
          filePath: require.resolve(moduleName),
          type: 'sourceFile',
        };
      } catch (error) {
        console.warn('\n4️⃣ require.resolve cannot resolve: ', moduleName);
      }

      try {
        const resolution = getDefaultConfig(require.resolve(moduleName)).resolver?.resolveRequest;
        return resolution(context, moduleName, platform);
      } catch (error) {
        console.warn('\n5️⃣ getDefaultConfig cannot resolve: ', moduleName);
      }
    },
  },
  transformer,
};
module.exports = mergeConfig(getDefaultConfig(__dirname), rainbowConfig);
