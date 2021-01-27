import { useMemo } from 'react';
import useImageMetadata from './useImageMetadata';
import {
  getTokenMetadata,
  getUrlForTrustIconFallback,
  isETH,
  pseudoRandomArrayItemFromString,
} from '@rainbow-me/utils';

export default function useColorForAsset(asset, fallbackColor) {
  const { address, color } = asset;
  const token = getTokenMetadata(address);
  const tokenListColor = token?.color;

  const { color: imageColor } = useImageMetadata(
    getUrlForTrustIconFallback(address)
  );

  const { isDarkMode, colors } = useTheme();

  const colorDerivedFromAddress = useMemo(
    () =>
      isETH(address)
        ? colors.dark
        : pseudoRandomArrayItemFromString(address, colors.avatarColor),
    [address, colors]
  );

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
