// eslint-disable-next-line import/no-commonjs
module.exports = function(api) {
  api.cache(true);

  const plugins = [
    'babel-plugin-styled-components',
    'date-fns',
    'graphql-tag',
    ['lodash', { id: ['lodash', 'recompact', 'recompose'] }],
  ];

  const presets = [
    'module:metro-react-native-babel-preset',
    'module:react-native-dotenv',
  ];

  return {
    env: {
      development: {
        plugins: [
          ...plugins,
          [
            'transform-remove-console',
            { exclude: ['disableYellowBox', 'error', 'info', 'log'] },
          ],
        ],
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
