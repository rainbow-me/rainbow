module.exports = {
  preset: 'react-native',
  moduleNameMapper: { '^recoil$': 'recoil/native/index.js' },
  setupFiles: ['./config/test/jest-setup.js'],
  testMatch: ['**/*.(spec|test).[tj]s?(x)'],
  testPathIgnorePatterns: ['node_modules', '/e2e/', '\\.disabled\\.[jt]sx?$'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native(?:-[^/]+)?|recoil|@nktkas/hyperliquid|@noble/[^/]+|@scure/[^/]+|imgix-core-js|react-native-payments|@react-native-firebase|@react-native(-community)?|react-native-reanimated|react-native-markdown-display|react-native-mmkv)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
