import { IS_IOS } from '@/env';
import { getTheme } from '@/handlers/localstorage/theme';
import { ActionSheetIOS, ActionSheetIOSOptions, Appearance } from 'react-native';
import ActionSheet from 'react-native-action-sheet';
import { Themes } from '@/theme/ThemeContext';

const determineUserInterfaceStyle = async () => {
  let currentTheme = await getTheme();

  if (currentTheme === Themes.SYSTEM) {
    const isSystemDarkMode = Appearance.getColorScheme() === Themes.DARK;
    currentTheme = isSystemDarkMode ? Themes.DARK : Themes.LIGHT;
  }

  return currentTheme;
};

export default async function showActionSheetWithOptions(
  options: ActionSheetIOSOptions,
  callback: (buttonIndex: number | undefined) => void
) {
  const userInterfaceStyle = await determineUserInterfaceStyle();
  if (IS_IOS) {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        userInterfaceStyle,
        ...options,
      },
      callback
    );
  } else {
    ActionSheet.showActionSheetWithOptions(
      {
        userInterfaceStyle,
        ...options,
      },
      callback
    );
  }
}
