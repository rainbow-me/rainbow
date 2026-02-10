import { getDeterministicIndex } from '@/framework/core/utils/getDeterministicIndex';
import { ITEMS_COLOR_PALETTE } from '@/features/polymarket/constants';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { ResponseByTheme } from '@/__swaps__/utils/swaps';

export function getColorBySeed(seed: string): ResponseByTheme<string> {
  const colorIndex = getDeterministicIndex({ seed, length: ITEMS_COLOR_PALETTE.length });
  const color = ITEMS_COLOR_PALETTE[colorIndex];
  return {
    light: getHighContrastColor(color, false),
    dark: getHighContrastColor(color, true),
  };
}
