import { useMemo } from 'react';
import { useForegroundColor } from '../../color/useForegroundColor';
import { headingSizes, headingWeights } from '../../typography/typography';
import { HeadingProps } from './Heading';

export function useHeadingStyle({
  align: textAlign,
  color = 'primary',
  size = '20px',
  weight = 'heavy',
}: Pick<HeadingProps, 'align' | 'color' | 'size' | 'weight'>) {
  const colorValue = useForegroundColor(color);
  const sizeStyles = headingSizes[size];
  const weightStyles = headingWeights[weight];

  const textStyle = useMemo(
    () =>
      ({
        color: colorValue,
        textAlign,
        ...sizeStyles,
        ...weightStyles,
      } as const),
    [colorValue, textAlign, sizeStyles, weightStyles]
  );

  return textStyle;
}
