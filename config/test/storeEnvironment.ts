import { vi } from 'vitest';

vi.mock('react-native-dotenv', () => ({
  PLATFORM_BASE_URL: 'https://platform.test',
  PLATFORM_API_KEY: 'test',
  LOG_LEVEL: undefined,
  LOG_DEBUG: undefined,
}));

// Store tests use the real palette without loading Skia and the native component barrel.
vi.mock('@/design-system', () => vi.importActual('@/design-system/color/palettes'));

vi.mock('react-native-version-number', () => ({ default: { appVersion: '1.0.0', buildVersion: '1' } }));

vi.mock('@react-native-firebase/remote-config', () => ({
  default: () => ({
    setConfigSettings: async () => undefined,
    setDefaults: async () => undefined,
    fetchAndActivate: async () => false,
    getAll: () => ({}),
  }),
}));

vi.mock('react-native-image-colors', () => ({
  getColors: async () => {
    throw new Error('Native image sampling is unavailable in store tests');
  },
}));
