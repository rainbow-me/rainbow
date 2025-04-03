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

/**
 * @desc Safely convert options to strings.
 * This should technically never do anything since we have proper type checking, but
 * it's a good sanity check for javascript files that are not typed.
 * @param options - The options to convert (string[])
 * @returns The options as strings
 */
const safeOptions = (options: ActionSheetIOSOptions['options']) => {
  return options
    .map(option => {
      if (typeof option === 'undefined') return null;
      if (typeof option === 'string') {
        return option;
      }
      return `${option}`;
    })
    .filter(Boolean);
};

export default async function showActionSheetWithOptions(
  { options, ...props }: ActionSheetIOSOptions,
  callback: (buttonIndex: number | undefined) => void
) {
  const userInterfaceStyle = await determineUserInterfaceStyle();
  const sheetOptions = safeOptions(options);

  if (IS_IOS) {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        userInterfaceStyle,
        options: sheetOptions,
        ...props,
      },
      callback
    );
  } else {
    ActionSheet.showActionSheetWithOptions(
      {
        userInterfaceStyle,
        options: sheetOptions,
        ...props,
      },
      callback
    );
  }
}
