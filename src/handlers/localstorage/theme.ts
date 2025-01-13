import { IS_ANDROID } from '@/env';
import { getGlobal, saveGlobal } from './common';
import { NativeModules } from 'react-native';
import { colors } from '@/styles';
import { Themes, ThemesType } from '@/theme';
import { isUsingButtonNavigation } from '@/utils/deviceUtils';

const { NavigationBar } = NativeModules;

const THEME = 'theme';

export const getColorForThemeAndNavigationStyle = (theme: ThemesType) => {
  if (!isUsingButtonNavigation()) return 'transparent';
  return theme === Themes.DARK ? '#191A1C' : colors.white;
};

/**
 * @desc get theme
 * @return {String}
 */
export const getTheme = () => getGlobal(THEME, 'system');

/**
 * @desc save theme
 */
export const saveTheme = (theme: ThemesType, isSystemDarkMode: boolean) => {
  if (IS_ANDROID) {
    const themeToUse = theme === Themes.SYSTEM ? (isSystemDarkMode ? Themes.DARK : Themes.LIGHT) : theme;
    NavigationBar.changeBarColors(
      themeToUse === Themes.DARK,
      getColorForThemeAndNavigationStyle('light'),
      getColorForThemeAndNavigationStyle('dark')
    );
  }

  return saveGlobal(THEME, theme);
};
