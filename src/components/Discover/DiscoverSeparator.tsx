import React, { memo } from 'react';
import { Separator } from '@/design-system/components/Separator/Separator';
import { useColorMode } from '@/design-system/color/ColorMode';
import { foregroundColors } from '@/design-system/color/palettes';
import { opacity } from '@/framework/ui/utils/opacity';

export const DiscoverSeparator = memo(function DiscoverSeparator() {
  const { isDarkMode } = useColorMode();
  return <Separator color={isDarkMode ? { custom: opacity(foregroundColors.separator.dark, 0.08) } : 'separatorSecondary'} thickness={1} />;
});
