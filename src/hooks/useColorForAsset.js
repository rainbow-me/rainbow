import { useMemo } from 'react';
import { lightModeThemeColors } from '../styles/colors';
import useImageMetadata from './useImageMetadata';
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
  const { address, color, mainnet_address } = asset;
  const token = getTokenMetadata(mainnet_address || address);
  const tokenListColor = token?.color;

  const { color: imageColor } = useImageMetadata(
    getUrlForTrustIconFallback(address)
  );

  const isDarkMode = forceLightMode || isDarkModeTheme;

  const colorDerivedFromAddress = useMemo(() => {
    const isETHAddress = isETH(address);
    let color;
    if (isETHAddress && isDarkMode) {
      color = forceETHColor
        ? colors.appleBlue
        : colors.brighten(lightModeThemeColors.dark);
    } else if (isETHAddress) {
      color = colors.dark;
    } else {
      color = pseudoRandomArrayItemFromString(
        address,
        colors.avatarBackgrounds
      );
    }
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
