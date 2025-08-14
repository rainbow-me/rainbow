module.exports = {
  preset: 'react-native',
  setupFiles: ['./config/test/jest-setup.js'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))(?<!\\.disabled)\\.[jt]sx?$',
  testPathIgnorePatterns: ['node_modules', 'e2e'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|imgix-core-js|react-native-payments|@react-native-firebase|@react-native(-community)?|react-native-reanimated|react-native-markdown-display)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
