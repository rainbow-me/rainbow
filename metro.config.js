// eslint-disable-next-line import/no-extraneous-dependencies
const exclusionList = require('metro-config/private/defaults/exclusionList').default;
const { mergeConfig, getDefaultConfig } = require('@react-native/metro-config');
// const { withSentryConfig } = require('@sentry/react-native/metro');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const path = require('path');

// Deny list is a function that takes an array of regexes and combines
// them with the default exclusion list to return a single regex.
const blockList = exclusionList([
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

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const rainbowConfig = {
  resolver: {
    blockList,
    resolveRequest: (context, moduleName, platform) => {
      try {
        return context.resolveRequest(context, moduleName, platform);
      } catch (error) {
        console.warn('\n1️⃣ context.resolveRequest cannot resolve: ', moduleName);
      }

      try {
        const defaultConfig = getDefaultConfig(__dirname);
        const resolution = require.resolve(moduleName, {
          paths: [path.dirname(context.originModulePath), ...defaultConfig.resolver.nodeModulesPaths],
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
        const defaultConfig = getDefaultConfig(__dirname);
        return defaultConfig.resolver.resolveRequest(context, moduleName, platform);
      } catch (error) {
        console.warn('\n3️⃣ default resolver cannot resolve: ', moduleName);
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
        const defaultConfig = getDefaultConfig(__dirname);
        return defaultConfig.resolver.resolveRequest(context, moduleName, platform);
      } catch (error) {
        console.warn('\n5️⃣ default resolver cannot resolve: ', moduleName);
      }

      throw new Error(`Unable to resolve module: ${moduleName}`);
    },
  },
  transformer,
};

const config = mergeConfig(getDefaultConfig(__dirname), rainbowConfig);

// Temporarily disable Sentry config due to RN 0.81.0 compatibility issue
// const sentryConfig = withSentryConfig(config, {
//   annotateReactComponents: true,
// });

// Need support for import.meta to enable this.
// sentryConfig.resolver.unstable_enablePackageExports = false;

module.exports = wrapWithReanimatedMetroConfig(config);
