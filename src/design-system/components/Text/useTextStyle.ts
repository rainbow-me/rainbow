import { useMemo } from 'react';
import { useForegroundColor } from '../../color/useForegroundColor';
import {
  textColors,
  textSizes,
  textWeights,
} from '../../typography/typography';
import { TextProps } from './Text';

export function useTextStyle({
  align: textAlign,
  color = 'primary',
  size = '16px',
  weight = 'regular',
  tabularNumbers = false,
  uppercase = false,
}: Pick<
  TextProps,
  'align' | 'color' | 'size' | 'weight' | 'tabularNumbers' | 'uppercase'
>) {
  if (__DEV__) {
    if (color && typeof color === 'string' && !textColors.includes(color)) {
      throw new Error(
        `Text: Invalid color "${color}". Valid colors are: ${textColors
          .map(x => `"${x}"`)
          .join(', ')}`
      );
    }
  }

  const colorValue = useForegroundColor(color);
  const sizeStyles = textSizes[size];
  const weightStyles = textWeights[weight];

  const textStyle = useMemo(
    () =>
      ({
        color: colorValue,
        textAlign,
        ...sizeStyles,
        ...weightStyles,
        ...(uppercase ? { textTransform: 'uppercase' as const } : null),
        ...(tabularNumbers ? { fontVariant: ['tabular-nums' as const] } : null),
      } as const),
    [sizeStyles, weightStyles, textAlign, colorValue, tabularNumbers, uppercase]
  );

  return textStyle;
}
