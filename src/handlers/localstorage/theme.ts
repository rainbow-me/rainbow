import { Platform } from 'react-native';

import { SystemBars } from 'react-native-edge-to-edge';

import { Themes, type ThemesType } from '@/theme/ThemeContext';

import { getGlobal, saveGlobal } from './common';

const THEME = 'theme';

/**
 * @desc get theme
 * @return {String}
 */
export const getTheme = (): Promise<ThemesType> => getGlobal(THEME, 'system');

/**
 * @desc save theme
 */
export const saveTheme = (theme: ThemesType, isSystemDarkMode: boolean) => {
  if (Platform.OS === 'android') {
    const themeToUse = theme === Themes.SYSTEM ? (isSystemDarkMode ? Themes.DARK : Themes.LIGHT) : theme;
    SystemBars.setStyle(themeToUse === Themes.DARK ? 'light' : 'dark');
  }

  return saveGlobal(THEME, theme);
};
