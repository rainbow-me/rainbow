import { memo } from 'react';

import GradientText from '@/components/text/GradientText';
import { Text, useColorMode, type TextProps } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { RNBW_BUTTON_CONFIG } from '@/features/rnbw-membership/rnbwButtonTheme';

export const RnbwButtonText = memo(function RnbwButtonText({
  variant = 'primary',
  size = '20pt',
  weight = 'heavy',
  children,
}: {
  variant?: 'primary' | 'secondary';
  size?: TextProps['size'];
  weight?: TextProps['weight'];
  children: string;
}) {
  const { colorMode } = useColorMode();

  if (variant === 'primary') {
    return (
      <GradientText
        colors={RNBW_BUTTON_CONFIG.primary.text.colors}
        start={RNBW_BUTTON_CONFIG.primary.text.start}
        end={RNBW_BUTTON_CONFIG.primary.text.end}
        shadow={RNBW_BUTTON_CONFIG.primary.text.shadow}
      >
        <Text size={size} weight={weight} color="label">
          {children}
        </Text>
      </GradientText>
    );
  }

  return (
    <Text size={size} weight={weight} color={{ custom: getValueForColorMode(RNBW_BUTTON_CONFIG.secondary.text.color, colorMode) }}>
      {children}
    </Text>
  );
});
