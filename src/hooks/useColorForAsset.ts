import { useMemo } from 'react';
import { lightModeThemeColors } from '../styles/colors';
import useImageMetadata from './useImageMetadata';
import { AssetTypes } from '@rainbow-me/entities';
import {
  getTokenMetadata,
  getUrlForTrustIconFallback,
  isETH,
  pseudoRandomArrayItemFromString,
} from '@rainbow-me/utils';

export default function useColorForAsset(
  asset = {},
  fallbackColor,
  forceLightMode = false,
  forceETHColor = false
) {
  const { isDarkMode: isDarkModeTheme, colors } = useTheme();
  const { address, color, mainnet_address, type } = asset;
  const token = getTokenMetadata(mainnet_address || address);
  const tokenListColor = token?.color;

  const { color: imageColor } = useImageMetadata(
    getUrlForTrustIconFallback(
      mainnet_address || address,
      mainnet_address ? AssetTypes.token : type
    )
  );

  const isDarkMode = forceLightMode || isDarkModeTheme;

  const colorDerivedFromAddress = useMemo(() => {
    const color = isETH(address)
      ? isDarkMode
        ? forceETHColor
          ? colors.appleBlue
          : colors.brighten(lightModeThemeColors.dark)
        : colors.dark
      : pseudoRandomArrayItemFromString(address, colors.avatarBackgrounds);
    return color;
  }, [address, colors, forceETHColor, isDarkMode]);

  return useMemo(() => {
    let color2Return;
    if (color) {
      color2Return = color;
    } else if (tokenListColor) {
      color2Return = tokenListColor;
    } else if (imageColor) {
      color2Return = imageColor;
    } else if (fallbackColor) {
      color2Return = fallbackColor;
    } else {
      color2Return = colorDerivedFromAddress;
    }
    try {
      return isDarkMode && colors.isColorDark(color2Return)
        ? colors.brighten(color2Return)
        : color2Return;
    } catch (e) {
      return color2Return;
    }
  }, [
    color,
    colorDerivedFromAddress,
    colors,
    fallbackColor,
    imageColor,
    isDarkMode,
    tokenListColor,
  ]);
}
