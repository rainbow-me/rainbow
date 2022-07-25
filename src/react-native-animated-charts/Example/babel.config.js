module.exports = {
  plugins: [
    ['babel-plugin-styled-components'],
    [
      'module-resolver',
      {
        alias: {
          fbjs: './node_modules/fbjs',
          'hoist-non-react-statics': './node_modules/hoist-non-react-statics',
          invariant: './node_modules/invariant',
          'prop-types': './node_modules/prop-types',
          react: './node_modules/react',
          'react-native': './node_modules/react-native',
          'react-native-animated-charts': './../src',
          'react-native-gesture-handler':
            './node_modules/react-native-gesture-handler',
          'react-native-haptic-feedback':
            './node_modules/react-native-haptic-feedback',
          'react-native-reanimated': './node_modules/react-native-reanimated',
          'react-native-svg': './node_modules/react-native-svg',
        },
        root: ['./../src'],
      },
    ],
    'react-native-reanimated/plugin',
  ],
  presets: ['module:metro-react-native-babel-preset'],
};
