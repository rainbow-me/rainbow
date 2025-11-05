module.exports = {
  preset: 'react-native',
  setupFiles: ['./config/test/jest-setup.js'],
  testMatch: ['**/*.(spec|test).[tj]s?(x)'],
  testPathIgnorePatterns: ['node_modules', 'e2e', '\\.disabled\\.[jt]sx?$'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|imgix-core-js|react-native-payments|@react-native-firebase|@react-native(-community)?|react-native-reanimated|react-native-linear-gradient|react-native-markdown-display)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
