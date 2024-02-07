const path = require('path');
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const withPlugins = require('next-compose-plugins');
const webpack = require('webpack'); // eslint-disable-line import/no-extraneous-dependencies

const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  babelConfigFile: path.resolve('./babel.config.js'),
  transpilePackages: ['react-native-reanimated', 'react-native-markdown-display', 'react-native-drop-shadow'],
  experimental: {
    externalDir: true, // https://github.com/vercel/next.js/pull/22867
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: config => {
    config.resolve.modules = [path.join(__dirname, './node_modules'), 'node_modules'];
    config.plugins.push(
      new webpack.DefinePlugin({
        __DEV__: true,
        android: false,
        ios: false,
        web: true,
      })
    );
    return config;
  },
};

module.exports = withPlugins([withVanillaExtract, withReactNativeWeb], nextConfig);

// /////////////////////////////////////////////////////////////////////////

function withReactNativeWeb(nextConfig) {
  return {
    ...nextConfig,
    webpack: (config, options) => {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        // Transform all direct `react-native` imports to `react-native-web`
        'react-native$': 'react-native-web',
      };
      config.resolve.extensions = ['.web.js', '.web.ts', '.web.tsx', ...config.resolve.extensions];

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }
      return config;
    },
  };
}
