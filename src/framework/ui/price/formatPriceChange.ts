import { toFixedWorklet } from '@/framework/core/safeMath';

/**
 * SF-symbol arrow glyphs shared by all generic market UI.
 * Source of truth moved from @/features/perps/constants to avoid perps coupling in generic cards.
 */
export const UP_ARROW = '􀄨';
export const DOWN_ARROW = '􀄩';

/**
 * Formats a normalized percent-change value to a display string with a `%` suffix.
 *
 * Contract: the input is already in percent units — `"5.23"` means 5.23%, not 0.000523.
 * Generic cards/helpers MUST NOT multiply or divide by 10_000; that conversion is source-scoped
 * (e.g. inside the perps or token display hooks).
 *
 * Examples:
 *   "5.23"  => "5.23%"
 *   "0"     => "0.00%"
 *   "-3.5"  => "3.50%"   (absolute value — arrow conveys direction)
 *   ""      => "0.00%"   (guard for empty/non-finite input)
 *   "NaN"   => "0.00%"
 */
export function formatNormalizedPercentChange(value: string | number): string {
  'worklet';
  const num = Number(value);
  if (!isFinite(num)) return '0.00%';
  return `${toFixedWorklet(Math.abs(num), 2)}%`;
}

/**
 * Parses a percent-change display string back to a number.
 * Useful for width-math that needs the numeric magnitude.
 *
 * "5.23%" => 5.23
 * "5.23"  => 5.23
 * ""      => 0
 */
export function parseNormalizedPercentChange(value: string): number {
  return Number(value.replace('%', '')) || 0;
}
