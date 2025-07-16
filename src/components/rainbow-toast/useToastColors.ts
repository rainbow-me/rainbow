import { useColorMode } from '@/design-system';
import { useTheme } from '@/theme/ThemeContext';

export const useToastColors = () => {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const foreground = isDarkMode ? colors.whiteLabel : colors.dark;
  const shadowColor = isDarkMode ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.1)';

  return {
    foreground,
    foregroundDim: isDarkMode ? colors.whiteLabel : colors.darkGrey,
    background: isDarkMode ? '#191A1C' : colors.darkGrey,
    borderColor: isDarkMode ? '#F5F8FF0F' : '#ccc',
    loadingText: colors.appleBlue,
    green: colors.green,
    red: colors.red,
    purple: colors.purple,
    clearBlue: colors.clearBlue,
    white: colors.white,
    shadowColor,
    pressColor: isDarkMode ? 'rgba(50,50,50,0.2)' : 'rgba(200,200,200,0.2)',
  };
};
