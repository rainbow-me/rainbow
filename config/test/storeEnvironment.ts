// Store tests use the real palette without loading Skia and the native component barrel.
jest.mock('@/design-system', () =>
  jest.requireActual<typeof import('../../src/design-system/color/palettes')>('../../src/design-system/color/palettes')
);

jest.mock('react-native-dotenv', () => ({ PLATFORM_BASE_URL: 'https://platform.test', PLATFORM_API_KEY: 'test' }));

jest.mock('react-native-version-number', () => ({ appVersion: '1.0.0', buildVersion: '1' }));

jest.mock('@react-native-firebase/remote-config', () => ({
  __esModule: true,
  default: () => ({
    setConfigSettings: async () => undefined,
    setDefaults: async () => undefined,
    fetchAndActivate: async () => false,
    getAll: () => ({}),
  }),
}));

jest.mock('@ledgerhq/react-native-hw-transport-ble', () => ({
  __esModule: true,
  default: {
    open: async () => {
      throw new Error('Bluetooth is unavailable in store tests');
    },
  },
}));

jest.mock('react-native-image-colors', () => ({
  getColors: async () => {
    throw new Error('Native image sampling is unavailable in store tests');
  },
}));

jest.mock('react-native-dark-mode', () => ({ useDarkMode: () => false }));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: async () => {
    throw new Error('The browser is unavailable in store tests');
  },
}));

jest.mock('expo-store-review', () => ({ isAvailableAsync: async () => false }));
