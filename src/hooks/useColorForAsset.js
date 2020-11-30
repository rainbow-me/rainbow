import { useMemo } from 'react';
import useImageMetadata from './useImageMetadata';
import { colors } from '@rainbow-me/styles';
import {
  getTokenMetadata,
  getUrlForTrustIconFallback,
  isETH,
  pseudoRandomArrayItemFromString,
} from '@rainbow-me/utils';

export default function useColorForAsset(asset, fallbackColor) {
  const { address, color } = asset;
  const token = getTokenMetadata(address);
  const tokenListColor = token?.extensions?.color;

  const { color: imageColor } = useImageMetadata(
    getUrlForTrustIconFallback(address)
  );

  const colorDerivedFromAddress = useMemo(
    () =>
      isETH(address)
        ? colors.dark
        : pseudoRandomArrayItemFromString(address, colors.avatarColor),
    [address]
  );

  return useMemo(() => {
    if (color) return color;
    if (tokenListColor) return tokenListColor;
    if (imageColor) return imageColor;
    if (fallbackColor) return fallbackColor;
    return colorDerivedFromAddress;
  }, [
    color,
    colorDerivedFromAddress,
    fallbackColor,
    imageColor,
    tokenListColor,
  ]);
}
