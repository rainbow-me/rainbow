import { Appearance, Platform } from 'react-native';

import { createBaseStore, createDerivedStore } from '@storesjs/stores';
import { eventEmitter } from 'react-native-dark-mode';

import { useAppSettingsStore } from '@/features/settings/data/appSettingsStore';
import { darkModeThemeColors, lightModeThemeColors, type Colors } from '@/styles/colors';

import { Themes } from './themes';

// ============ Types ========================================================== //

/** Effective application appearance; colors reference an existing shared palette. */
export type ThemeState = {
  readonly colorMode: 'light' | 'dark';
  readonly colors: Colors;
  readonly isDarkMode: boolean;
};

// ============ Theme Store ==================================================== //

const lightTheme: ThemeState = { colorMode: 'light', colors: lightModeThemeColors, isDarkMode: false };
const darkTheme: ThemeState = { colorMode: 'dark', colors: darkModeThemeColors, isDarkMode: true };

const nativeAppearanceStore = createBaseStore(readNativeDarkMode);

/** The effective theme, derived from the saved preference and native appearance. */
export const useThemeStore = createDerivedStore<ThemeState>($ => {
  const preference = $(useAppSettingsStore, s => s.theme);
  const isDarkMode = preference === Themes.SYSTEM ? $(nativeAppearanceStore, s => s) : preference === Themes.DARK;
  return isDarkMode ? darkTheme : lightTheme;
});

// ============ Global Theme Tracking ========================================== //

if (Platform.OS === 'ios') {
  eventEmitter.on('currentModeChanged', mode => nativeAppearanceStore.setState(mode === Themes.DARK));
} else {
  Appearance.addChangeListener(({ colorScheme }) => nativeAppearanceStore.setState(colorScheme === Themes.DARK));
}

useAppSettingsStore.subscribe(
  s => s.theme,
  theme => {
    Appearance.setColorScheme(theme === Themes.SYSTEM ? null : theme);
    nativeAppearanceStore.setState(readNativeDarkMode());
  },
  { fireImmediately: true }
);

function readNativeDarkMode(): boolean {
  return (Platform.OS === 'ios' ? eventEmitter.currentMode : Appearance.getColorScheme()) === Themes.DARK;
}
