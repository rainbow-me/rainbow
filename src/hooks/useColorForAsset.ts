import { useMemo } from 'react';
import { lightModeThemeColors } from '../styles/colors';
import { ParsedAddressAsset } from '@/entities';
import { ethereumUtils, isETH, pseudoRandomArrayItemFromString } from '@/utils';
import { usePersistentDominantColorFromImage } from './usePersistentDominantColorFromImage';

export default function useColorForAsset(
  asset: Partial<ParsedAddressAsset> = {},
  fallbackColor: string | undefined = undefined,
  forceLightMode = false,
  forceETHColor = false
) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { isDarkMode: isDarkModeTheme, colors } = useTheme();
  const { address, mainnet_address, type } = asset;
  const accountAsset = ethereumUtils.getAssetFromAllAssets(
    asset?.uniqueId || mainnet_address || address
  );
  const resolvedAddress = mainnet_address || address || accountAsset?.address;

  console.log('triggered for: ', accountAsset?.symbol, accountAsset?.colors);
  console.log(accountAsset);

  const derivedColor = usePersistentDominantColorFromImage(
    accountAsset?.icon_url
  );
  const isDarkMode = forceLightMode || isDarkModeTheme;

  const colorDerivedFromAddress = useMemo(() => {
    const color = isETH(resolvedAddress)
      ? isDarkMode
        ? forceETHColor
          ? colors.appleBlue
          : colors.brighten(lightModeThemeColors.dark)
        : colors.dark
      : pseudoRandomArrayItemFromString(
          resolvedAddress,
          colors.avatarBackgrounds
        );
    return color;
  }, [colors, forceETHColor, isDarkMode, resolvedAddress]);

  return useMemo(() => {
    let color2Return;
    if (isETH(resolvedAddress)) {
      color2Return = colorDerivedFromAddress;
    } else if (accountAsset?.colors?.primary) {
      color2Return = accountAsset?.colors?.primary;
      if (!isDarkMode && colors.isColorLight(color2Return)) {
        return colors.darken(color2Return);
      }
    } else if (derivedColor) {
      color2Return = derivedColor;
    } else if (accountAsset?.colors?.fallback) {
      color2Return = accountAsset?.colors?.fallback;
    } else if (fallbackColor) {
      color2Return = fallbackColor;
    } else {
      color2Return = colorDerivedFromAddress;
    }
    try {
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
    colorDerivedFromAddress,
    colors,
    derivedColor,
    fallbackColor,
    isDarkMode,
    resolvedAddress,
  ]);
}
