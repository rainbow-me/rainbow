import { IS_ANDROID } from '@/env';
import { getGlobal, saveGlobal } from './common';
import { Themes, ThemesType } from '@/theme';
import { SystemBars } from 'react-native-edge-to-edge';

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
  if (IS_ANDROID) {
    const themeToUse = theme === Themes.SYSTEM ? (isSystemDarkMode ? Themes.DARK : Themes.LIGHT) : theme;
    SystemBars.setStyle({ statusBar: themeToUse === Themes.DARK ? 'light' : 'dark' });
  }

  return saveGlobal(THEME, theme);
};
