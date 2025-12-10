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
  },
  project: {
    android: {},
    ios: {},
  },
};
