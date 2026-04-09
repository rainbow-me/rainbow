import React from 'react';

import { fonts } from '@/styles';

import { Text } from '../text';

export default function SheetTitle({ size = fonts.size.large, weight = fonts.weight.heavy, ...props }) {
  const { colors } = useTheme();
  return <Text align="center" color={colors.dark} letterSpacing="roundedMedium" size={size} weight={weight} {...props} />;
}
