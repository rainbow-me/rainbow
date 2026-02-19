import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { oklchToHex } from '@/worklets/colors';
import { isHex, keccak256, stringToHex } from 'viem';
import { ResponseByTheme } from '@/__swaps__/utils/swaps';

const TWO_PI = Math.PI * 2;
const UINT32_MAX = 0xffffffff;

const CHROMA_RANGE = { min: 0.11, max: 0.21 };
const LIGHTNESS_RANGE = { min: 0.56, max: 0.68 };

function mapToRange(value: number, min: number, max: number): number {
  return min + value * (max - min);
}

function getNormalizedSeedHex(seed: string): string {
  const normalizedSeed = seed.trim().toLowerCase();
  return isHex(normalizedSeed) ? normalizedSeed : keccak256(stringToHex(normalizedSeed));
}

function getSeedChannelValue(normalizedHex: string, start: number): number {
  const channelHex = normalizedHex.slice(start, start + 8).padEnd(8, '0');
  const channelValue = Number.parseInt(channelHex, 16);
  return Number.isNaN(channelValue) ? 0 : channelValue / UINT32_MAX;
}

function getColorFromSeed(seed: string): string {
  if (!seed) return '#4d82ff';

  const seedHex = getNormalizedSeedHex(seed).replace('0x', '').padStart(64, '0');
  const hexLength = seedHex.length;

  const hueSeed = getSeedChannelValue(seedHex, hexLength - 8);
  const chromaSeed = getSeedChannelValue(seedHex, hexLength - 16);
  const lightnessSeed = getSeedChannelValue(seedHex, hexLength - 24);

  const H = hueSeed * TWO_PI;
  const C = mapToRange(chromaSeed, CHROMA_RANGE.min, CHROMA_RANGE.max);
  const L = mapToRange(lightnessSeed, LIGHTNESS_RANGE.min, LIGHTNESS_RANGE.max);

  return oklchToHex({ L, C, H });
}

export function getColorBySeed(seed: string): ResponseByTheme<string> {
  const color = getColorFromSeed(seed);
  return {
    light: getHighContrastColor(color, false),
    dark: getHighContrastColor(color, true),
  };
}
