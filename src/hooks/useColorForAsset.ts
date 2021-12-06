import { useMemo } from 'react';
import { lightModeThemeColors } from '../styles/colors';
import useImageMetadata from './useImageMetadata';
import {
  getTokenMetadata,
  getUrlForTrustIconFallback,
  isETH,
  pseudoRandomArrayItemFromString,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/utils';

export default function useColorForAsset(
  asset = {},
  fallbackColor: any,
  forceLightMode = false,
  forceETHColor = false
) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { isDarkMode: isDarkModeTheme, colors } = useTheme();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type '{}'.
  const { address, color, mainnet_address } = asset;
  const token = getTokenMetadata(mainnet_address || address);
  const tokenListColor = token?.color;

  const { color: imageColor } = useImageMetadata(
    getUrlForTrustIconFallback(address)
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
