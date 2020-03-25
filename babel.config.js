// eslint-disable-next-line import/no-commonjs
module.exports = {
  env: {
    development: {
      plugins: [
        [
          'transform-remove-console',
          { exclude: ['disableYellowBox', 'error', 'info', 'log'] },
        ],
      ],
    },
    production: {
      plugins: [['transform-remove-console', { exclude: ['error'] }]],
    },
  },
  plugins: [
    'babel-plugin-styled-components',
    'date-fns',
    'graphql-tag',
    ['lodash', { id: ['lodash', 'recompact', 'recompose'] }],
  ],
  presets: [
    'module:metro-react-native-babel-preset',
    'module:react-native-dotenv',
  ],
};
