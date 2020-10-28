import React from 'react';
import { ButtonPressAnimation } from './animations';
import { Icon } from './icons';
import { colors } from '@rainbow-me/styles';

export default function AndroidCloseButton({ onPress, style }) {
  return (
    <ButtonPressAnimation onPress={onPress} opacityTouchable style={style}>
      <Icon color={colors.blueGreyDark} name="close" />
    </ButtonPressAnimation>
  );
}
