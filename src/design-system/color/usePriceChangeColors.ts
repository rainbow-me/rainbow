import { useMemo } from 'react';

import { type ColorMode } from '@/design-system/color/palettes';

import { getColorForTheme, useForegroundColor } from './useForegroundColor';

export type PriceChangeColors = Readonly<{
  negative: string;
  neutral: string;
  positive: string;
}>;

export function usePriceChangeColors(): PriceChangeColors {
  const negative = useForegroundColor('red');
  const neutral = useForegroundColor('labelTertiary');
  const positive = useForegroundColor('green');

  return useMemo(() => ({ negative, neutral, positive }), [negative, neutral, positive]);
}

export function getPriceChangeColors(colorMode: ColorMode): PriceChangeColors {
  return {
    negative: getColorForTheme('red', colorMode),
    neutral: getColorForTheme('labelTertiary', colorMode),
    positive: getColorForTheme('green', colorMode),
  };
}

export function getPriceChangeColor(priceChange: string, priceChangeColors: PriceChangeColors): string {
  'worklet';
  const value = Number(priceChange);
  if (value > 0) return priceChangeColors.positive;
  if (value < 0) return priceChangeColors.negative;
  return priceChangeColors.neutral;
}
