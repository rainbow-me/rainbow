module.exports = {
  assets: ['./src/assets/fonts'],
  dependencies: {
    'react-native-video': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-video/android-exoplayer',
        },
      },
    },
    'react-native-ios-context-menu': {
      platforms: { android: null },
    },
    ...(process.env.SKIP_FLIPPER
      ? {
          'react-native-flipper': { platforms: { ios: null, android: null } },
          'react-native-flipper-performance-plugin': {
            platforms: { ios: null, android: null },
          },
        }
      : {}),
  },
  project: {
    android: {},
    ios: {},
  },
};
