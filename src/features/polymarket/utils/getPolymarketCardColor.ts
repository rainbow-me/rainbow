import chroma from 'chroma-js';

import { type ResponseByTheme } from '@/__swaps__/utils/swaps';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getColorBySeed } from '@/features/polymarket/utils/getColorBySeed';
import { getImagePrimaryColor } from '@/features/polymarket/utils/getImageColors';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { withTimeout } from '@/utils/promise';

const IMAGE_COLOR_TIMEOUT_MS = 600;

const MIN_CARD_COLOR_SATURATION = 0.16;
const MIN_CARD_COLOR_LIGHTNESS = 0.12;
const MAX_CARD_COLOR_LIGHTNESS = 0.92;
const MIN_CARD_COLOR_ALPHA = 0.05;

function isCardAccentColor(color: string): boolean {
  if (!chroma.valid(color)) return false;
  const c = chroma(color);
  const [, s, l] = c.hsl();
  const a = c.alpha();
  if (Number.isNaN(s) || Number.isNaN(l)) return false;
  return s >= MIN_CARD_COLOR_SATURATION && l >= MIN_CARD_COLOR_LIGHTNESS && l <= MAX_CARD_COLOR_LIGHTNESS && a > MIN_CARD_COLOR_ALPHA;
}

function getHighContrastColorTheme(color: string): ResponseByTheme<string> {
  return {
    light: getHighContrastColor(color, false),
    dark: getHighContrastColor(color, true),
  };
}

/**
 * Resolves the accent color for an event-level card (e.g. Discover predictions
 * carousel cards). Pulls color from the event's own imagery rather than per-
 * market data; falls back to a deterministic seeded color when the image fails
 * the HSL gates or the fetch times out.
 */
export async function resolvePolymarketCardColor({
  event,
}: {
  event: PolymarketEvent | RawPolymarketEvent;
}): Promise<ResponseByTheme<string>> {
  const eventImageUrl = event.image || event.icon;
  if (eventImageUrl) {
    try {
      const eventImageColor = await withTimeout(
        getImagePrimaryColor(eventImageUrl),
        IMAGE_COLOR_TIMEOUT_MS,
        '[resolvePolymarketCardColor]: getImagePrimaryColor timed out'
      );
      if (eventImageColor && isCardAccentColor(eventImageColor)) {
        return getHighContrastColorTheme(eventImageColor);
      }
    } catch {
      // fall through to seed fallback
    }
  }
  return getColorBySeed(event.id);
}
