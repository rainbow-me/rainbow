import { NativeModules } from 'react-native';

import { getGlobal, saveGlobal } from './common';
import { IS_ANDROID } from '@/env';

const THEME = 'theme';

const { NavigationBar } = NativeModules;

/**
 * @desc get theme
 * @return {String}
 */
export const getTheme = () => getGlobal(THEME, 'light');

const themeToInt = (theme: string) => {
  switch (theme) {
    default:
    case 'light':
      return 0;
    case 'dark':
      return 1;
  }
};

const themeToColor = (theme: string) => {
  switch (theme) {
    default:
    case 'light':
      return 0xffffff;
    case 'dark':
      return 0x000000;
  }
};

/**
 * @desc save theme
 */
export const saveTheme = (theme: any) => {
  if (IS_ANDROID) {
    NavigationBar.setNavigationColor(
      themeToColor(theme),
      false,
      themeToInt(theme),
      4
    );
  }

  return saveGlobal(THEME, theme);
};
