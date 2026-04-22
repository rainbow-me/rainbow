import React, { memo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { type TextProps } from '@/design-system';

import { RnbwButtonSurface } from './RnbwButtonSurface';
import { RnbwButtonText } from './RnbwButtonText';

export const RnbwButton = memo(function RnbwButton({
  variant = 'primary',
  label,
  height = 42,
  size = '22pt',
  weight = 'heavy',
  onPress,
  style,
  containerStyle,
}: {
  variant?: 'primary' | 'secondary';
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
      <RnbwButtonSurface variant={variant} height={height} style={containerStyle}>
        <RnbwButtonText variant={variant} size={size} weight={weight}>
          {label}
        </RnbwButtonText>
      </RnbwButtonSurface>
    </ButtonPressAnimation>
  );
});
