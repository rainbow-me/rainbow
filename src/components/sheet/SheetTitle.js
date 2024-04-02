import React from 'react';
import { Text } from '../text';
import { fonts } from '@/styles';
import { useForegroundColor } from '@/design-system';

export default function SheetTitle({ size = fonts.size.large, weight = fonts.weight.heavy, ...props }) {
  const label = useForegroundColor('label');
  return <Text align="center" color={label} letterSpacing="roundedMedium" size={size} weight={weight} {...props} />;
}
