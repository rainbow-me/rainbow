import { vi } from 'vitest';

// ============ Platform ======================================================= //

vi.mock('@/utils/deviceUtils', () => ({ deviceUtils: { dimensions: { height: 874, width: 402 } } }));
vi.mock('react-native-device-info', () => ({ identify: () => null, reset: () => null, setup: () => null }));

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
  const { useRef } = await vi.importActual<typeof import('react')>('react');
  return {
    convertToRGBA,
    isColor,
    makeMutable: <T>(value: T) => ({ value }),
    useSharedValue: <T>(value: T) => useRef({ value }).current,
    runOnUI: (worklet: () => void) => worklet,
  };
});

vi.mock('react-native-reanimated/lib/module/core', () => ({ makeShareable: <T>(value: T) => value }));
