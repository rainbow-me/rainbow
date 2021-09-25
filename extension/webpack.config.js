const path = require('path');
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
    path: path.resolve(__dirname, 'dist'),
  },
  performance: {
    hints: false,
  },
};
