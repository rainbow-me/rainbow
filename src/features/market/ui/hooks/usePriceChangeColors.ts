import { useMemo } from 'react';

import { useForegroundColor } from '@/design-system/color/useForegroundColor';

import { type PriceChangeColors } from '../utils/priceChangeColors';

export function usePriceChangeColors(): PriceChangeColors {
  const negative = useForegroundColor('red');
  const neutral = useForegroundColor('labelTertiary');
  const positive = useForegroundColor('green');

  return useMemo(() => ({ negative, neutral, positive }), [negative, neutral, positive]);
}
