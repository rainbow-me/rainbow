import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type ThemesType } from './themes';

const native = vi.hoisted(() => ({
  platform: 'ios',
  appearance: 'light',
  screen: 'light',
  appearanceListener: vi.fn<(event: { colorScheme: string }) => void>(),
  screenListener: vi.fn<(mode: string) => void>(),
  setColorScheme: vi.fn(),
}));
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return native.platform;
    },
  },
  Appearance: {
    getColorScheme: () => native.appearance,
    setColorScheme: native.setColorScheme,
    addChangeListener: (listener: (event: { colorScheme: string }) => void) => {
      native.appearanceListener.mockImplementation(listener);
    },
  },
}));
vi.mock('react-native-dark-mode', () => ({
  eventEmitter: {
    get currentMode() {
      return native.screen;
    },
    on: (_event: string, listener: (mode: string) => void) => {
      native.screenListener.mockImplementation(listener);
    },
  },
}));
vi.mock('@/features/settings/data/appSettingsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useAppSettingsStore: createBaseStore<{ theme: ThemesType }>(() => ({ theme: 'system' })) };
});
vi.mock('@/styles/colors', () => ({ lightModeThemeColors: { mode: 'light' }, darkModeThemeColors: { mode: 'dark' } }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  native.platform = 'ios';
  native.appearance = 'light';
  native.screen = 'light';
});

describe('native appearance', () => {
  it('ignores native changes for an explicit preference and reads the latest iOS mode for system', async () => {
    const { useAppSettingsStore } = await import('@/features/settings/data/appSettingsStore');
    const { useThemeStore } = await import('./themeStore');
    useAppSettingsStore.setState({ theme: 'dark' });
    native.screenListener('light');
    expect(useThemeStore.getState().isDarkMode).toBe(true);
    useAppSettingsStore.setState({ theme: 'system' });
    expect(native.setColorScheme).toHaveBeenLastCalledWith(null);
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });

  it('follows asynchronous Android appearance changes while retaining the system preference', async () => {
    native.platform = 'android';
    native.appearance = 'dark';
    const { useAppSettingsStore } = await import('@/features/settings/data/appSettingsStore');
    const { useThemeStore } = await import('./themeStore');
    useAppSettingsStore.setState({ theme: 'dark' });
    useAppSettingsStore.setState({ theme: 'system' });
    expect(useThemeStore.getState().isDarkMode).toBe(true);
    native.appearance = 'light';
    native.appearanceListener({ colorScheme: 'light' });
    expect(useThemeStore.getState().isDarkMode).toBe(false);
    expect(useAppSettingsStore.getState().theme).toBe('system');
  });
});
