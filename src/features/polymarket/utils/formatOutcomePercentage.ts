import { toPercentageWorklet } from '@/framework/core/safeMath';

/** Formats an outcome probability without rounding it to a whole percentage. */
export function formatOutcomePercentage(value: string | number): string {
  'worklet';
  return `${toPercentageWorklet(value)}%`;
}
