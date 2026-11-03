import React from 'react';

import { Text } from '@/design-system';
import { type TextProps } from '@/design-system/components/Text/Text';

import { type PnlDirection } from './pnlFormat';

export function pnlColor(direction: PnlDirection, colors: { green: string; red: string }): TextProps['color'] {
  return direction === 'flat' ? 'labelSecondary' : { custom: direction === 'loss' ? colors.red : colors.green };
}

export function PnlArrow({ color, direction, size, weight }: Pick<TextProps, 'color' | 'size' | 'weight'> & { direction: PnlDirection }) {
  if (direction === 'flat') return null;
  return (
    <Text color={color} size={size} weight={weight}>
      {direction === 'loss' ? '􀄩' : '􀄨'}
    </Text>
  );
}
