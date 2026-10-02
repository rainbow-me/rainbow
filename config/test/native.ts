import { vi } from 'vitest';

// ============ Platform ======================================================= //

vi.mock('react-native', () => {
  const native = {
    AppState: { addEventListener: vi.fn(() => ({ remove: vi.fn() })) },
    Dimensions: { get: () => ({ width: 750, height: 1334, scale: 2, fontScale: 2 }) },
    NativeModules: {},
    Platform: { OS: 'ios', select: selectIOS },
    unstable_batchedUpdates: (callback: () => unknown) => callback(),
  };
  return { default: native, ...native };
});

vi.mock('@/utils/deviceUtils', () => ({ deviceUtils: { dimensions: { height: 874, width: 402 } } }));
vi.mock('react-native-device-info', () => ({ identify: () => null, reset: () => null, setup: () => null }));

vi.mock('@react-navigation/native', () => ({
  useRoute: () => {
    throw new Error('Native navigation hooks require a mounted navigator; provide the route in the test');
  },
}));

// ============ Native Services ================================================ //

vi.mock('react-native-keychain', () => ({
  ACCESSIBLE: { ALWAYS_THIS_DEVICE_ONLY: 'kSecAttrAccessibleAlwaysThisDeviceOnly' },
  getGenericPassword: vi.fn(),
  resetGenericPassword: vi.fn(),
  setGenericPassword: vi.fn(),
}));

vi.mock('react-native-passkeys', () => ({ create: vi.fn(), get: vi.fn(), isSupported: vi.fn(() => true) }));
vi.mock('react-native-permissions', () => ({ requestNotifications: vi.fn() }));
vi.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: vi.fn(() => {
      throw new Error('Native hybrid objects are unavailable in Node tests');
    }),
  },
}));

vi.mock('@sentry/react-native', () => ({ captureException: vi.fn() }));
vi.mock('posthog-react-native', () => ({
  PostHog: vi.fn(function () {
    return {
      capture: vi.fn(),
      identify: vi.fn(),
      optIn: vi.fn().mockResolvedValue(undefined),
      optOut: vi.fn().mockResolvedValue(undefined),
      ready: vi.fn().mockResolvedValue(undefined),
      screen: vi.fn(),
    };
  }),
}));

vi.mock('react-native-appsflyer', () => ({
  default: {
    getAppsFlyerUID: vi.fn((callback: (error: null, id: string) => void) => callback(null, 'mock-appsflyer-id')),
    initSdk: vi.fn((_options: unknown, onSuccess?: (result: string) => void) => onSuccess?.('success')),
    logEvent: vi.fn(),
    setCustomerUserId: vi.fn(),
  },
}));

// ============ Worklets ======================================================= //

vi.mock('react-native-reanimated', async () => {
  const { convertToRGBA, isColor } = await vi.importActual<Pick<typeof import('react-native-reanimated'), 'convertToRGBA' | 'isColor'>>(
    'react-native-reanimated/lib/module/Colors'
  );
  return { convertToRGBA, isColor, makeMutable: <T>(value: T) => ({ value }) };
});

vi.mock('react-native-reanimated/lib/module/core', () => ({ makeShareable: <T>(value: T) => value }));

// ============ Local Helpers ================================================== //

function selectIOS<T>(values: { ios?: T; native?: T; default?: T }): T | undefined {
  if ('ios' in values) return values.ios;
  return 'native' in values ? values.native : values.default;
}
