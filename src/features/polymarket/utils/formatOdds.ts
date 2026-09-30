import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';

/**
 * Formats a probability as a whole percentage, or `--` when absent.
 */
export function formatOdds(value?: string | number | null): string {
  if (value == null || value === '') return '--';
  return `${roundWorklet(toPercentageWorklet(value))}%`;
}
