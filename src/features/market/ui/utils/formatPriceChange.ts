import { toFixedWorklet } from '@/framework/core/safeMath';

export const UP_ARROW = '􀄨';
export const DOWN_ARROW = '􀄩';

// Input is already in percent units — "5.23" means 5.23%, not 0.0523
export function formatNormalizedPercentChange(value: string | number): string {
  'worklet';
  const num = Number(value);
  if (!isFinite(num)) return '0.00%';
  return `${toFixedWorklet(Math.abs(num), 2)}%`;
}

export function parseNormalizedPercentChange(value: string): number {
  return Number(value.replace('%', '')) || 0;
}
