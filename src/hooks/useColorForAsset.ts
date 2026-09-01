import { useMemo } from 'react';

import { isHex, keccak256, stringToHex } from 'viem';

import type { ParsedAddressAsset } from '@/entities/tokens';
import { useTheme } from '@/theme/ThemeContext';
import ethereumUtils from '@/utils/ethereumUtils';
import isETH from '@/utils/isETH';

import { lightModeThemeColors } from '../styles/colors';
import { getHighContrastColor } from './useAccountAccentColor';
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
    let color2Return;

    // we have special handling for eth color
    if (isETH(resolvedAddress)) {
      color2Return = colorDerivedFromAddress;

      // image derived color from BE for tokens passed via params (usually assets not in wallet)
    } else if (asset?.colors?.primary) {
      color2Return = asset?.colors?.primary;

      // token image derived color from BE
    } else if (accountAsset?.colors?.primary) {
      color2Return = accountAsset?.colors?.primary;

      // token image derived color on client
    } else if (derivedColor) {
      color2Return = derivedColor;

      // fallback color from BE
    } else if (accountAsset?.colors?.fallback) {
      color2Return = accountAsset?.colors?.fallback;

      // custom fallback color from args
    } else if (fallbackColor) {
      color2Return = fallbackColor;

      // fallback color derived from address
    } else {
      color2Return = colorDerivedFromAddress;
    }

    if (!color2Return) {
      color2Return = fallbackColor || colors.blueGreyDark;
    }

    try {
      // brighten up dark colors in dark mode
      if (isDarkMode && colors.isColorDark(color2Return)) {
        return colors.brighten(color2Return);
      } else if (!isDarkMode) {
        return getHighContrastColor(color2Return, isDarkMode);
      }
      return color2Return;
    } catch (e) {
      return color2Return;
    }
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
