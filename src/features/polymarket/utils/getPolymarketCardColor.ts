import chroma from 'chroma-js';

import { type ResponseByTheme } from '@/__swaps__/utils/swaps';
import { type RawPolymarketEvent, type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getColorBySeed } from '@/features/polymarket/utils/getColorBySeed';
import { getImagePrimaryColor } from '@/features/polymarket/utils/getImageColors';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';

const MIN_CARD_COLOR_SATURATION = 0.16;
const MIN_CARD_COLOR_LUMINANCE = 0.12;
const MAX_CARD_COLOR_LUMINANCE = 0.92;
const MIN_CARD_COLOR_ALPHA = 0.05;

type ResolvePolymarketCardColorParams = {
  event: RawPolymarketEvent;
  sortedMarkets: RawPolymarketMarket[];
};

export async function resolvePolymarketCardColor({
  event,
  sortedMarkets,
}: ResolvePolymarketCardColorParams): Promise<ResponseByTheme<string>> {
  const firstActiveMarket = sortedMarkets.find(market => market.active && !market.closed);

  const marketSeriesColor = getPrimarySeriesColor(firstActiveMarket?.seriesColor);
  if (marketSeriesColor) return getHighContrastColorTheme(marketSeriesColor);

  const marketImageUrl = firstActiveMarket?.icon || firstActiveMarket?.image;
  const eventImageUrl = event.icon || event.image;
  const [marketImageColor, eventImageColor] = await Promise.all([getImageColorTheme(marketImageUrl), getImageColorTheme(eventImageUrl)]);

  if (marketImageColor) return marketImageColor;
  if (eventImageColor) return eventImageColor;

  return getColorBySeed(firstActiveMarket?.conditionId ?? event.id);
}

async function getImageColorTheme(imageUrl: string | undefined): Promise<ResponseByTheme<string> | null> {
  if (!imageUrl) return null;
  const color = await getImagePrimaryColor(imageUrl);
  return isCardAccentColor(color) ? getHighContrastColorTheme(color) : null;
}

function getPrimarySeriesColor(seriesColor: string | undefined): string | null {
  const primary = seriesColor?.split(',')[0]?.trim();
  return primary && chroma.valid(primary) ? primary : null;
}

function isCardAccentColor(color: string | undefined | null): color is string {
  if (!color || !chroma.valid(color)) return false;

  const parsedColor = chroma(color);
  const [, saturation, lightness] = parsedColor.hsl();
  const [, , , alpha] = parsedColor.rgba();

  if (alpha <= MIN_CARD_COLOR_ALPHA) return false;
  if (lightness <= MIN_CARD_COLOR_LUMINANCE || lightness >= MAX_CARD_COLOR_LUMINANCE) return false;

  return Number.isFinite(saturation) && saturation >= MIN_CARD_COLOR_SATURATION;
}

function getHighContrastColorTheme(color: string): ResponseByTheme<string> {
  return {
    light: getHighContrastColor(color, false),
    dark: getHighContrastColor(color, true),
  };
}
