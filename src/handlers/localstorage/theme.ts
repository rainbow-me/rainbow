import { IS_ANDROID } from '@/env';
import { getGlobal, saveGlobal } from './common';
import { NativeModules, Dimensions } from 'react-native';
import { colors } from '@/styles';

const { NavigationBar } = NativeModules;

const THEME = 'theme';

// Android only to see if the user is using 3-button nav or gesture
const isUsingButtonNavigation = () => {
  const deviceHeight = Dimensions.get('screen').height;
  const windowHeight = Dimensions.get('window').height;
  const bottomNavBarHeight = deviceHeight - windowHeight;
  return bottomNavBarHeight > 80;
};

const getColorForThemeAndNavigationStyle = (theme: string) => {
  if (!isUsingButtonNavigation()) {
    return 'transparent';
  }

  return theme === 'dark' ? '#191A1C' : colors.white;
};

/**
 * @desc get theme
 * @return {String}
 */
export const getTheme = () => getGlobal(THEME, 'light');

/**
 * @desc save theme
 */
export const saveTheme = (theme: string) => {
  if (IS_ANDROID) {
    NavigationBar.changeNavigationBarColor(
      getColorForThemeAndNavigationStyle(theme),
      theme === 'light',
      true
    );
  }

  return saveGlobal(THEME, theme);
};
