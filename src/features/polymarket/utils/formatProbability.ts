import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';

/**
 * Formats a probability as a whole percentage, or an en dash when unavailable.
 */
export function formatProbability(value?: string | number): string {
  'worklet';
  return value === undefined ? '–' : `${roundWorklet(toPercentageWorklet(value))}%`;
}
