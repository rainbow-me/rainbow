// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');
// @ts-ignore — types ship only via `exports` field, which moduleResolution:"node" ignores.
const exclusionList = require('metro-config/private/defaults/exclusionList').default;
// @ts-ignore — types ship in dist/ but only via `exports` field, which moduleResolution:"node" ignores. Resolvable after migrating to moduleResolution:"bundler".
const { mergeConfig, getDefaultConfig } = require('@react-native/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

// RN 0.81's Metro applies package.json `exports` conditions per-package, but
// it does not advertise `browser` on native platforms (only on `web`) and
// always picks `import` over `default` for ESM-style imports. Several
// packages publish their browser-safe build behind one of those conditions:
//
//  - `axios` gates `dist/browser/axios.cjs` behind the `browser` condition;
//    without it Metro picks `dist/node/axios.cjs`, which `require()`s Node
//    builtins (`http`, `https`, `url`, `stream`, `zlib`) and crashes on
//    launch the moment reservoir-sdk's top-level `axios.create()` runs.
//  - `@reservoir0x/reservoir-sdk` ships a Parcel-mangled `dist/index.mjs`
//    whose named exports come through as `undefined` under Hermes.
//
// For these packages we route to a known-good CJS entry directly.
const FORCE_CJS_PACKAGES = {
  '@reservoir0x/reservoir-sdk': path.join(__dirname, 'node_modules/@reservoir0x/reservoir-sdk/dist/index.js'),
  'axios': path.join(__dirname, 'node_modules/axios/dist/browser/axios.cjs'),
};

// Packages that ship ESM under `_esm/*` and CJS under `_cjs/*` (or analogous
// directories). For any subpath request to these packages, we redirect to the
// package's CJS entry via its package.json `default` condition.
const FORCE_CJS_PACKAGE_PREFIXES = ['viem', 'ox', 'abitype'];

const cjsResolutionCache = new Map();

function resolveToCjs(moduleName) {
  if (cjsResolutionCache.has(moduleName)) return cjsResolutionCache.get(moduleName);

  const parts = moduleName.split('/');
  const pkgName = moduleName.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  const subpath = moduleName.startsWith('@')
    ? parts.length > 2
      ? './' + parts.slice(2).join('/')
      : '.'
    : parts.length > 1
      ? './' + parts.slice(1).join('/')
      : '.';

  let pkgJsonPath;
  try {
    pkgJsonPath = require.resolve(`${pkgName}/package.json`);
  } catch {
    cjsResolutionCache.set(moduleName, null);
    return null;
  }
  const pkg = require(pkgJsonPath);

  // Walk pkg.exports[subpath], take the `default` condition, fall back to `require`.
  const entry = pkg.exports?.[subpath];
  let target = null;
  if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
    target = entry.default ?? entry.require ?? null;
    if (target && typeof target === 'object') target = target.default ?? target.require ?? null;
  } else if (typeof entry === 'string') {
    target = entry;
  }
  if (!target && subpath === '.' && typeof pkg.main === 'string') target = pkg.main;
  if (!target) {
    cjsResolutionCache.set(moduleName, null);
    return null;
  }
  // Bypass Node 22+ strict `exports` enforcement by joining against the
  // package's resolved root directory rather than `require.resolve`-ing a
  // subpath that may not be listed in `exports`.
  const filePath = path.resolve(path.dirname(pkgJsonPath), target);
  cjsResolutionCache.set(moduleName, filePath);
  return filePath;
}

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

      const pkgName = moduleName.startsWith('@') ? moduleName.split('/').slice(0, 2).join('/') : moduleName.split('/')[0];
      if (FORCE_CJS_PACKAGE_PREFIXES.includes(pkgName)) {
        const cjsPath = resolveToCjs(moduleName);
        if (cjsPath) {
          return { filePath: cjsPath, type: 'sourceFile' };
        }
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
