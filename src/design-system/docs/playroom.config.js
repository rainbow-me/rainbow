const path = require('path');
const webpack = require('webpack'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  baseUrl: '/playroom/',
  components: './.playroom/components.ts',
  exampleCode: ``,
  frameComponent: './.playroom/FrameComponent.js',
  iframeSandbox: 'allow-scripts',
  openBrowser: false,
  outputPath: './out/playroom',
  paramType: 'search',
  port: 9000,
  themes: './.playroom/themes.ts',
  title: 'Rainbow Playroom',
  webpackConfig: () => ({
    module: {
      rules: [
        {
          include: [path.join(__dirname, '..'), /react-native-markdown-display/, /react-native-reanimated/, /react-native-drop-shadow/],
          test: /\.(js|ts|tsx)$/,
          use: {
            loader: 'babel-loader',
            options: {
              cwd: path.join(__dirname, '..'),
              extends: path.resolve(__dirname, './node_modules/playroom/.babelrc'),
              plugins: [
                [path.resolve(__dirname, './node_modules/babel-plugin-react-native-web'), { commonjs: true }],
                'react-native-reanimated/plugin',
              ],
            },
          },
        },
        {
          exclude: /node_modules\/(?!(typeface-exo-2)\/).*/,
          test: /\.css$/,
          use: [require.resolve('style-loader'), require.resolve('css-loader')],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        __DEV__: true,
        android: false,
        ios: false,
        web: true,
      }),
    ],
    resolve: {
      alias: {
        'react-native$': 'react-native-web',
        'react-native-drop-shadow': path.join(__dirname, './react-native-drop-shadow.tsx'),
      },
      extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx'],
      modules: [path.join(__dirname, './node_modules'), 'node_modules'],
    },
  }),
  widths: [320],
};
