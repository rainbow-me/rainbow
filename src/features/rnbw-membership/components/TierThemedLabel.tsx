import { memo } from 'react';

import GradientText from '@/components/text/GradientText';
import { useColorMode, type TextProps } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { getTierLabelTheme } from '@/features/rnbw-membership/tierVisuals';
import type { Tier } from '@/features/rnbw-membership/types';

const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 0, y: 1 };

export const TierThemedLabel = memo(function TierThemedLabel({ tier, children }: { tier: Tier; children: React.ReactElement<TextProps> }) {
  const { colorMode, isDarkMode } = useColorMode();

  if (isDarkMode) return children;

  const { gradient: textGradient } = getTierLabelTheme(tier.level);
  const {
    colors: textGradientColors,
    locations: textGradientLocations,
    start: textGradientStart = GRADIENT_START,
    end: textGradientEnd = GRADIENT_END,
  } = getValueForColorMode(textGradient, colorMode);

  return (
    <GradientText colors={textGradientColors} locations={textGradientLocations} start={textGradientStart} end={textGradientEnd}>
      {children}
    </GradientText>
  );
});
