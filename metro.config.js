// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');
// @ts-ignore — types ship only via `exports` field, which moduleResolution:"node" ignores.
const exclusionList = require('metro-config/private/defaults/exclusionList').default;
// @ts-ignore — types ship in dist/ but only via `exports` field, which moduleResolution:"node" ignores. Resolvable after migrating to moduleResolution:"bundler".
const { mergeConfig, getDefaultConfig } = require('@react-native/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

// RN 0.81's Metro routes static `import` statements to packages' `import`
// condition (the .mjs entry). For packages that ship Parcel-mangled ESM
// there, named exports come through as `undefined` once Hermes loads the
// release bundle and the app crashes on launch. Force these to their CJS
// `main` entry, which works.
//
// Detection: app crashes on launch with `Cannot read property '<name>' of
// undefined` (or `Cannot read property 'prototype' of undefined` if a class
// inheritance falls through). Add the package here when found.
const FORCE_CJS_PACKAGES = {
  '@reservoir0x/reservoir-sdk': path.join(__dirname, 'node_modules/@reservoir0x/reservoir-sdk/dist/index.js'),
  // `viem` and `viem/chains` are required transitively by @reservoir0x/reservoir-sdk's
  // CJS file. viem's `_esm/*` is a barrel of named re-exports; some sub-files use
  // `class X extends BaseError` patterns whose ESM-imported parent resolves to
  // `undefined` in the Hermes release bundle, producing
  // `Cannot read property 'prototype' of undefined` on first reservoir use.
  'viem': path.join(__dirname, 'node_modules/viem/_cjs/index.js'),
  'viem/chains': path.join(__dirname, 'node_modules/viem/_cjs/chains/index.js'),
};

// Block list is a function that takes an array of regexes and combines
// them with the default exclusion list to return a single regex.
const blockList = exclusionList([
  // Nested android build/generated directories (e.g. in node_modules) that cause fast reloads during android builds.
  // Top-level ios/ and android/ dirs are excluded via .watchmanconfig ignore_dirs.
  /.*\/android\/build\/.*/,
  /.*\/android\/\.cxx\/.*/,
  /.*\/android\/.*\.xml/,
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
 * @type {import('metro-config').MetroConfig}
 */
const rainbowConfig = {
  resolver: {
    blockList,
    resolveRequest: (context, moduleName, platform) => {
      const cjsOverride = FORCE_CJS_PACKAGES[moduleName];
      if (cjsOverride) {
        return { filePath: cjsOverride, type: 'sourceFile' };
      }

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

      throw new Error(`Unable to resolve module: ${moduleName}`);
    },
  },
  transformer,
};

const config = mergeConfig(getDefaultConfig(__dirname), rainbowConfig);
const sentryConfig = withSentryConfig(config, {
  annotateReactComponents: true,
});

module.exports = wrapWithReanimatedMetroConfig(sentryConfig);
