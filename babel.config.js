const fs = require('fs');

const envLine = fs
  .readFileSync('./.env', 'utf8')
  .split('\n')
  .find(l => l.startsWith('SCRIPT_NM='));
const data = envLine && envLine.slice(10);

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
    ...(data ? [data] : []),
    [
      'module-resolver',
      {
        alias: getAliasesFromTsConfig(),
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        root: ['./src'],
      },
    ],
    '@babel/plugin-transform-export-namespace-from',
    'babel-plugin-styled-components',
    'date-fns',
    'graphql-tag',
    ['lodash', { id: ['lodash', 'recompact'] }],
    'react-native-worklets/plugin',
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

  const presets = ['module:@react-native/babel-preset'];

  return {
    env: {
      development: {
        plugins: [...plugins, ['transform-remove-console', { exclude: ['disableYellowBox', 'error', 'info', 'log'] }]],
        presets: presets,
      },
      production: {
        plugins: [...plugins, '@babel/plugin-transform-runtime', ['transform-remove-console', { exclude: ['error'] }]],
        presets: presets,
      },
    },
    plugins,
    presets,
  };
};
