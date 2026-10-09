import './setup';

import { vi } from 'vitest';

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

vi.mock('@react-navigation/native', () => ({
  useRoute: () => {
    throw new Error('Native navigation hooks require a mounted navigator; provide the route in the test');
  },
}));

// ============ Local Helpers ================================================== //

function selectIOS<T>(values: { ios?: T; native?: T; default?: T }): T | undefined {
  if ('ios' in values) return values.ios;
  return 'native' in values ? values.native : values.default;
}
