import { useMemo } from 'react';
import { lightModeThemeColors } from '../styles/colors';
import { ParsedAddressAsset } from '@/entities';
import { useTheme } from '@/theme';
import { ethereumUtils, isETH, pseudoRandomArrayItemFromString } from '@/utils';
import { usePersistentDominantColorFromImage } from './usePersistentDominantColorFromImage';

export default function useColorForAsset(
  asset: Partial<ParsedAddressAsset> = {},
  fallbackColor: string | undefined = undefined,
  forceLightMode = false,
  forceETHColor = false
) {
  const { isDarkMode: isDarkModeTheme, colors } = useTheme();
  const accountAsset = ethereumUtils.getAssetFromAllAssets(asset.uniqueId || asset.mainnet_address || asset.address);
  const resolvedAddress = asset.mainnet_address || asset.address || accountAsset.address;

  const derivedColor = usePersistentDominantColorFromImage(accountAsset?.icon_url || asset?.icon_url);
  const isDarkMode = forceLightMode || isDarkModeTheme;

  const colorDerivedFromAddress = useMemo(() => {
    if (!isETH(resolvedAddress)) {
      return pseudoRandomArrayItemFromString(resolvedAddress, colors.avatarBackgrounds);
    }

    if (isDarkMode) {
      if (forceETHColor) return colors.appleBlue;
      return colors.brighten(lightModeThemeColors.dark);
    }

    return colors.dark;
  }, [colors, forceETHColor, isDarkMode, resolvedAddress]);

  return useMemo(() => {
    let color2Return: string;

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

    try {
      // brighten up dark colors in dark mode
      if (isDarkMode && colors.isColorDark(color2Return)) {
        return colors.brighten(color2Return);
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
