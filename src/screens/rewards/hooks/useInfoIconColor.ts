import { useMemo } from 'react';

import { useTheme } from '@/theme/ThemeContext';

export function useInfoIconColor() {
  const { isDarkMode } = useTheme();
  return useMemo(() => (isDarkMode ? '#F5F8FF40' : '#1B1D1F40'), [isDarkMode]);
}
