import React, { memo } from 'react';
import { Separator, useColorMode } from '@/design-system';
import { foregroundColors } from '@/design-system/color/palettes';
import { opacity } from '@/__swaps__/utils/swaps';

export const DiscoverSeparator = memo(function DiscoverSeparator() {
  const { isDarkMode } = useColorMode();
  return <Separator color={isDarkMode ? { custom: opacity(foregroundColors.separator.dark, 0.08) } : 'separatorSecondary'} thickness={1} />;
});
