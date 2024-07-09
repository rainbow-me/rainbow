const path = require('path');

module.exports = {
  mode: 'production',
  target: 'web',
  // Entry file to start bundling
  entry: './src/browser/inpage.ts',
  // Webpack output configuration
  output: {
    filename: 'InjectedJSBundle.js',
    path: path.resolve('./'),
  },
  // Resolve TypeScript
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'react-native-crypto': 'crypto-browserify',
    },
    fallback: {
      fs: false,
      tls: false,
      net: false,
      path: false,
      zlib: false,
      http: false,
      stream: 'stream-browserify',
      https: 'agent-base',
      crypto: false,
    },
  },
  module: {
    rules: [
      {
        // Use ts-loader for TypeScript files
        test: /\.ts?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve('./src/browser/tsconfig.json'),
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  node: {
    global: true,
    __filename: false,
    __dirname: false,
  },
};
