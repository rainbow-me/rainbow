import { useMemo } from 'react';
import { lightModeThemeColors } from '../styles/colors';
import useImageMetadata from './useImageMetadata';
import { AssetType } from '@rainbow-me/entities';
import {
  getTokenMetadata,
  getUrlForTrustIconFallback,
  isETH,
  pseudoRandomArrayItemFromString,
} from '@rainbow-me/utils';

export default function useColorForAsset(
  asset = {},
  fallbackColor?: any,
  forceLightMode = false,
  forceETHColor = false
) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { isDarkMode: isDarkModeTheme, colors } = useTheme();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type '{}'.
  const { address, color, mainnet_address, type } = asset;
  const token = getTokenMetadata(mainnet_address || address);
  const tokenListColor = token?.color;

  const { color: imageColor } = useImageMetadata(
    getUrlForTrustIconFallback(
      mainnet_address || address,
      mainnet_address ? AssetType.token : type
    )
  );

  const isDarkMode = forceLightMode || isDarkModeTheme;

  const colorDerivedFromAddress = useMemo(() => {
    const color =
      isETH(address) || isETH(mainnet_address)
        ? isDarkMode
          ? forceETHColor
            ? colors.appleBlue
            : colors.brighten(lightModeThemeColors.dark)
          : colors.dark
        : pseudoRandomArrayItemFromString(
            mainnet_address || address,
            colors.avatarBackgrounds
          );
    return color;
  }, [address, colors, forceETHColor, isDarkMode, mainnet_address]);

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
