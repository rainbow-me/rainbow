import React from 'react';
import { Text } from '../text';
import { fonts } from '@rainbow-me/styles';

export default function SheetTitle({
  size = fonts.size.large,
  weight = fonts.weight.bold,
  ...props
}) {
  const { colors } = useTheme();
  return (
    <Text
      align="center"
      color={colors.dark}
      letterSpacing="roundedMedium"
      size={size}
      weight={weight}
      {...props}
    />
  );
}
