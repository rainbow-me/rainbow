import { useColorMode } from '@/design-system';
import { useTheme } from '@/theme/ThemeContext';
import { useMemo } from 'react';

export const useToastColors = () => {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();

  return useMemo(() => {
    return {
      foreground: isDarkMode ? colors.whiteLabel : colors.dark,
      foregroundDim: isDarkMode ? '#F5F8FF66' : colors.darkGrey,
      background: isDarkMode ? '#191A1C' : colors.white,
      loadingText: colors.appleBlue,
      green: colors.green,
      red: colors.red,
      purple: colors.purple,
      white: '#fff',
      pressColor: isDarkMode ? 'rgba(50,50,50,0.2)' : 'rgba(200,200,200,0.2)',
    };
  }, [isDarkMode, colors]);
};
