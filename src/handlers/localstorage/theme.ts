import { IS_ANDROID } from '@/env';
import { getGlobal, saveGlobal } from './common';
import { NativeModules } from 'react-native';
import { colors } from '@/styles';
import { isUsingButtonNavigation } from '@/helpers/statusBarHelper';

const { NavigationBar } = NativeModules;

const THEME = 'theme';

export const getColorForThemeAndNavigationStyle = (theme: string) => {
  if (!isUsingButtonNavigation()) {
    return 'transparent';
  }

  return theme === 'dark' ? '#191A1C' : colors.white;
};

/**
 * @desc get theme
 * @return {String}
 */
export const getTheme = () => getGlobal(THEME, 'system');

/**
 * @desc save theme
 */
export const saveTheme = (theme: string) => {
  if (IS_ANDROID) {
    NavigationBar.changeNavigationBarColor(getColorForThemeAndNavigationStyle(theme), theme === 'light', true);
  }

  return saveGlobal(THEME, theme);
};
