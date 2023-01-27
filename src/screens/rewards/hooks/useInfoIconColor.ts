import { useTheme } from '@/theme';
import { useMemo } from 'react';

export function useInfoIconColor() {
  const { isDarkMode } = useTheme();
  return useMemo(() => (isDarkMode ? '#F5F8FF40' : '#1B1D1F40'), [isDarkMode]);
}
