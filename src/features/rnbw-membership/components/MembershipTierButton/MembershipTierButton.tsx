import React, { memo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { type TextProps } from '@/design-system';
import type { Tier } from '@/features/rnbw-membership/types';

import { MembershipTierButtonSurface, type MembershipTierButtonVariant } from './MembershipTierButtonSurface';
import { MembershipTierButtonText } from './MembershipTierButtonText';

export const MembershipTierButton = memo(function MembershipTierButton({
  tier,
  variant = 'primary',
  label,
  height = 44,
  size = '22pt',
  weight = 'heavy',
  onPress,
  style,
  containerStyle,
}: {
  tier: Tier;
  variant?: MembershipTierButtonVariant;
  label: string;
  height?: number;
  size?: TextProps['size'];
  weight?: TextProps['weight'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ButtonPressAnimation onPress={onPress} style={style} wrapperStyle={style} scaleTo={0.96}>
      <MembershipTierButtonSurface tier={tier} variant={variant} height={height} style={containerStyle}>
        <MembershipTierButtonText tier={tier} variant={variant} size={size} weight={weight}>
          {label}
        </MembershipTierButtonText>
      </MembershipTierButtonSurface>
    </ButtonPressAnimation>
  );
});
