import { memo } from 'react';

import GradientText from '@/components/text/GradientText';
import { Text, useColorMode, type TextProps } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { getTierPrimaryButtonTheme, getTierSecondaryButtonTheme } from '@/features/rnbw-membership/tierVisuals';
import type { Tier } from '@/features/rnbw-membership/types';

import type { MembershipTierButtonVariant } from './MembershipTierButtonSurface';

const TEXT_GRADIENT_START = { x: 0, y: 0 };
const TEXT_GRADIENT_END = { x: 0, y: 1 };

export const MembershipTierButtonText = memo(function MembershipTierButtonText({
  tier,
  variant = 'primary',
  size = '20pt',
  weight = 'heavy',
  children,
}: {
  tier: Tier;
  variant?: MembershipTierButtonVariant;
  size?: TextProps['size'];
  weight?: TextProps['weight'];
  children: string;
}) {
  const { colorMode } = useColorMode();

  if (variant === 'primary') {
    const primaryButtonTheme = getTierPrimaryButtonTheme(tier.level);
    const labelGradient = getValueForColorMode(primaryButtonTheme.text.gradient, colorMode);
    const labelShadow = getValueForColorMode(primaryButtonTheme.text.shadow, colorMode);

    return (
      <GradientText
        colors={labelGradient.colors}
        locations={labelGradient.locations}
        start={labelGradient.start ?? TEXT_GRADIENT_START}
        end={labelGradient.end ?? TEXT_GRADIENT_END}
        shadow={labelShadow}
      >
        <Text size={size} weight={weight} color="label">
          {children}
        </Text>
      </GradientText>
    );
  }

  const secondaryTextColor = getValueForColorMode(getTierSecondaryButtonTheme(tier.level).textColor, colorMode);

  return (
    <Text size={size} weight={weight} color={{ custom: secondaryTextColor }}>
      {children}
    </Text>
  );
});
