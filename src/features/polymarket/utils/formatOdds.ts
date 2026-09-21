import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';

export function formatOdds(value?: string | number | null) {
  if (value == null || value === '') return '--';
  return `${roundWorklet(toPercentageWorklet(value))}%`;
}
