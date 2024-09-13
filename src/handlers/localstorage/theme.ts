import { IS_ANDROID } from '@/env';
import { getGlobal, saveGlobal } from './common';
import { NativeModules } from 'react-native';
import { colors } from '@/styles';
import { isUsingButtonNavigation } from '@/utils/deviceUtils';
import { Themes, ThemesType } from '@/theme';

const { NavigationBar } = NativeModules;

const THEME = 'theme';

export const getColorForThemeAndNavigationStyle = (theme: ThemesType) => {
  if (!isUsingButtonNavigation()) {
    return 'transparent';
  }

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
    NavigationBar.changeNavigationBarColor(getColorForThemeAndNavigationStyle(themeToUse), themeToUse === Themes.DARK, true);
  }

  return saveGlobal(THEME, theme);
};
