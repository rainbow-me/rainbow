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
    'babel-plugin-styled-components',
    '@babel/plugin-proposal-numeric-separator',
    'date-fns',
    'graphql-tag',
    ['lodash', { id: ['lodash', 'recompact'] }],
    'react-native-reanimated/plugin',
    [
      'module:react-native-dotenv',
      {
        allowUndefined: true,
        moduleName: 'react-native-dotenv',
      },
    ],
  ];

  const presets = ['module:metro-react-native-babel-preset'];

  return {
    env: {
      development: {
        plugins: [...plugins, ['transform-remove-console', { exclude: ['disableYellowBox', 'error', 'info', 'log'] }]],
        presets: presets,
      },
      production: {
        plugins: [
          ...plugins,
          '@babel/plugin-transform-runtime',
          '@babel/plugin-transform-react-inline-elements',
          ['transform-remove-console', { exclude: ['error'] }],
        ],
        presets: presets,
      },
    },
    plugins,
    presets,
  };
};
