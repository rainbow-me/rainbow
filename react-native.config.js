const path = require('path');

module.exports = {
  assets: ['./src/assets/fonts'],
  dependencies: {
    'react-native-ios-context-menu': {
      platforms: { android: null },
    },
    '@rainbow-me/codegen': {
      root: path.join(__dirname, 'src/codegen'),
    },
    'react-native-cool-modals': {
      root: path.join(__dirname, 'src/react-native-cool-modals'),
    },
  },
  project: {
    android: {},
    ios: {},
  },
};
