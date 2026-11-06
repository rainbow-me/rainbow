import { useMemo } from 'react';

import { isHex, keccak256, stringToHex } from 'viem';

import { getHighContrastColor } from '@/design-system/color/getHighContrastColor';
import type { ParsedAddressAsset } from '@/entities/tokens';
import { useTheme } from '@/theme/ThemeContext';
import ethereumUtils from '@/utils/ethereumUtils';
import isETH from '@/utils/isETH';

import { lightModeThemeColors } from '../styles/colors';
import { usePersistentDominantColorFromImage } from './usePersistentDominantColorFromImage';

export default function useColorForAsset(
  asset: Partial<ParsedAddressAsset> = {},
  fallbackColor: string | undefined = undefined,
  forceLightMode = false,
  forceETHColor = false
) {
  const { isDarkMode: isDarkModeTheme, colors } = useTheme();
  const accountAsset = ethereumUtils.getAssetFromAllAssets(asset?.uniqueId || asset?.mainnet_address || asset?.address);
  const resolvedAddress = asset?.mainnet_address || asset?.address || accountAsset?.address;

  const derivedColor = usePersistentDominantColorFromImage(accountAsset?.icon_url || asset?.icon_url);
  const isDarkMode = forceLightMode || isDarkModeTheme;

  const colorDerivedFromAddress = useMemo(() => {
    if (!resolvedAddress) {
      return undefined;
    }

    const color = isETH(resolvedAddress)
      ? isDarkMode
        ? forceETHColor
          ? colors.appleBlue
          : colors.brighten(lightModeThemeColors.dark)
        : colors.dark
      : colors.avatarBackgrounds[getDeterministicIndex({ seed: resolvedAddress, length: colors.avatarBackgrounds.length })];
    return color;
  }, [colors, forceETHColor, isDarkMode, resolvedAddress]);

  return useMemo(() => {
    const candidates = isETH(resolvedAddress)
      ? [colorDerivedFromAddress, fallbackColor ?? colors.blueGreyDark]
      : [
          asset?.colors?.primary,
          accountAsset?.colors?.primary,
          derivedColor,
          accountAsset?.colors?.fallback,
          fallbackColor,
          colorDerivedFromAddress ?? colors.blueGreyDark,
        ];

    for (const color of candidates) {
      if (!color) continue;
      if (isDarkMode) {
        try {
          return colors.isColorDark(color) ? colors.brighten(color) : color;
        } catch {
          continue;
        }
      }

      const adjusted = getHighContrastColor(color, false);
      if (adjusted) return adjusted;
    }
    return colors.blueGreyDark;
  }, [
    accountAsset?.colors?.fallback,
    accountAsset?.colors?.primary,
    asset?.colors?.primary,
    colorDerivedFromAddress,
    colors,
    derivedColor,
    fallbackColor,
    isDarkMode,
    resolvedAddress,
  ]);
}

function getDeterministicIndex({ seed, length }: { seed: string; length: number }): number {
  if (!seed || length <= 0) return 0;

  const normalizedSeed = seed.trim().toLowerCase();
  const sourceHex = isHex(normalizedSeed) ? normalizedSeed : keccak256(stringToHex(normalizedSeed));
  const tailHex = sourceHex.replace('0x', '').slice(-8);
  const hashNumber = Number.parseInt(tailHex, 16);

  return Number.isNaN(hashNumber) ? 0 : hashNumber % length;
}
