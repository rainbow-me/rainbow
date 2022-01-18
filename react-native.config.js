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
  },
  project: {
    android: {},
    ios: {},
  },
};
