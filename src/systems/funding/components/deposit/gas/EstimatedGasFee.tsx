import React from 'react';
import { Inline } from '@/design-system/components/Inline/Inline';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import type { TextProps } from '@/design-system/components/Text/Text';
import { SharedValue } from 'react-native-reanimated';
import { GasFeeText } from './GasFeeText';

type EstimatedGasFeeProps = {
  isFetching: SharedValue<boolean>;
} & Partial<Pick<TextProps, 'color' | 'size' | 'tabularNumbers' | 'weight'>>;

export function EstimatedGasFee({ color = 'labelTertiary', isFetching, size = '15pt', weight = 'bold' }: EstimatedGasFeeProps) {
  return (
    <Inline alignVertical="center" space="4px">
      <TextIcon color="labelQuaternary" height={10} size="icon 11px" weight="heavy" width={18}>
        􀵟
      </TextIcon>
      <GasFeeText color={color} isFetching={isFetching} size={size} weight={weight} />
    </Inline>
  );
}
