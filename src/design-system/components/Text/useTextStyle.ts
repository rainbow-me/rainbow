import { useMemo } from 'react';
import { textColors } from '../../color/palettes';
import { useForegroundColor } from '../../color/useForegroundColor';
import { textSizes, textWeights } from '../../typography/typography';
import { TextProps } from './Text';

export function useTextStyle({
  align: textAlign,
  color,
  size,
  weight = 'regular',
  tabularNumbers = false,
  uppercase = false,
}: Pick<TextProps, 'align' | 'color' | 'size' | 'weight' | 'tabularNumbers' | 'uppercase'>) {
  if (__DEV__) {
    if (color && typeof color === 'string' && !textColors.includes(color)) {
      throw new Error(`Text: Invalid color "${color}". Valid colors are: ${textColors.map(x => `"${x}"`).join(', ')}`);
    }
  }

  if (__DEV__) {
    if (!textSizes[size]) {
      throw new Error(
        `Text: ${size ? `Invalid size "${size}"` : 'Missing size prop'}. Valid sizes are: ${Object.keys(textSizes)
          .map(x => `"${x}"`)
          .join(', ')}`
      );
    }
  }

  const colorValue = useForegroundColor(color ?? 'label'); // Fallback for JS consumers
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
      }) as const,
    [sizeStyles, weightStyles, textAlign, colorValue, tabularNumbers, uppercase]
  );

  return textStyle;
}
