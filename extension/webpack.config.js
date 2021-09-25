const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './extension/src/provider.js',
  mode: 'production',
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: { keep_classnames: true, keep_fnames: true },
      }),
    ],
  },
  output: {
    filename: 'provider.js',
    path: path.resolve(__dirname, '../ios/Rainbow Bridge/Resources/dist'),
  },
  performance: {
    hints: false,
  },
  plugins: [
    new CopyPlugin([
      {
        from: path.resolve(__dirname, 'img'),
        to: path.resolve(__dirname, '../ios/Rainbow Bridge/Resources/img'),
      },
      {
        from: path.resolve(__dirname, 'manifest.json'),
        to: path.resolve(
          __dirname,
          '../ios/Rainbow Bridge/Resources/manifest.json'
        ),
      },
    ]),
  ],
};
