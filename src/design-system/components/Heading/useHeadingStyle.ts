import { useMemo } from 'react';
import { useForegroundColor } from '../../color/useForegroundColor';
import { headingSizes, headingWeights } from '../../typography/typography';
import { HeadingProps } from './Heading';

export function useHeadingStyle({ align: textAlign, color, size, weight }: Pick<HeadingProps, 'align' | 'color' | 'size' | 'weight'>) {
  if (__DEV__) {
    if (!headingSizes[size]) {
      throw new Error(
        `Heading: ${size ? `Invalid size "${size}"` : 'Missing size prop'}. Valid sizes are: ${Object.keys(headingSizes)
          .map(x => `"${x}"`)
          .join(', ')}`
      );
    }
  }

  const colorValue = useForegroundColor(color ?? 'label'); // Fallback for JS consumers
  const sizeStyles = headingSizes[size];
  const weightStyles = headingWeights[weight];

  const textStyle = useMemo(
    () =>
      ({
        color: colorValue,
        textAlign,
        ...sizeStyles,
        ...weightStyles,
      }) as const,
    [colorValue, textAlign, sizeStyles, weightStyles]
  );

  return textStyle;
}
