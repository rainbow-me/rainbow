import React, { memo } from 'react';
import Animated from 'react-native-reanimated';
import { Separator, useColorMode } from '@/design-system';
import { LAYOUT_ANIMATION } from './CollapsibleSection';

const SEPARATOR_COLOR = 'rgba(245, 248, 255, 0.025)';
const LIGHT_SEPARATOR_COLOR = 'rgba(9, 17, 31, 0.025)';

export const SheetSeparator = memo(function SheetSeparator() {
  const { isDarkMode } = useColorMode();
  return (
    <Animated.View layout={LAYOUT_ANIMATION}>
      <Separator color={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }} thickness={1} />
    </Animated.View>
  );
});
