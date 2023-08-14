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
  },
  project: {
    android: {},
    ios: {},
  },
};
