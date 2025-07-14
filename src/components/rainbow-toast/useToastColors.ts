import { useColorMode } from '@/design-system';
import { useTheme } from '@/theme/ThemeContext';

export const useToastColors = () => {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const foreground = isDarkMode ? colors.whiteLabel : colors.dark;

  return {
    foreground,
    foregroundDim: isDarkMode ? colors.whiteLabel : colors.darkGrey,
    green: colors.green,
    red: colors.red,
    purple: colors.purple,
    clearBlue: colors.clearBlue,
    white: colors.white,
  };
};
