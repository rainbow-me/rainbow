function getAliasesFromTsConfig() {
  const tsConfig = require('./tsconfig.json');
  const paths = tsConfig.compilerOptions.paths;
  let alias = {};
  Object.keys(paths).forEach(key => {
    alias[key.replace(/\/\*$/, '')] = `./${paths[key][0].replace(/\/\*$/, '')}`;
  });

  return alias;
}

module.exports = function (api) {
  const isJest = api.caller(caller => caller?.name === 'babel-jest');

  api.cache(true);

  const plugins = [
    [
      'module-resolver',
      {
        alias: getAliasesFromTsConfig(),
        extensions: ['.ios.ts', '.ios.tsx', '.android.ts', '.android.tsx', '.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        root: ['./src'],
      },
    ],
    '@babel/plugin-transform-export-namespace-from',
    'babel-plugin-styled-components',
    'date-fns',
    'graphql-tag',
    ['lodash', { id: ['lodash', 'recompact'] }],
    'react-native-reanimated/plugin',
  ];

  // We don't want dotenv transform for unit tests.
  if (!isJest) {
    plugins.push([
      'module:react-native-dotenv',
      {
        allowUndefined: true,
        moduleName: 'react-native-dotenv',
      },
    ]);
  }

  const presets = [
    [
      'module:@react-native/babel-preset',
      {
        // Matches the @babel/runtime version range in package.json. Lets
        // transform-runtime import helpers added after 7.0 instead of
        // inlining a copy into every module (reduces bundle size).
        enableBabelRuntime: '^7.25.0',
      },
    ],
  ];

  return {
    env: {
      development: {
        plugins: [...plugins, ['transform-remove-console', { exclude: ['disableYellowBox', 'error', 'info', 'log'] }]],
        presets: presets,
      },
      production: {
        plugins: [...plugins, ['transform-remove-console', { exclude: ['error'] }]],
        presets: presets,
      },
    },
    plugins,
    presets,
  };
};
