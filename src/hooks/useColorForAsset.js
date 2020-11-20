import { map } from 'lodash';
import { useMemo } from 'react';
import {
  getUrlForTrustIconFallback,
  pseudoRandomArrayItemFromString,
} from '../utils';
import useImageMetadata, { useImagesColors } from './useImageMetadata';
import { colors } from '@rainbow-me/styles';

export function useColorForAssets(assets) {
  const fallbackUrls = useMemo(
    () => map(assets, asset => getUrlForTrustIconFallback(asset.address)),
    [assets]
  );

  const fallbackColors = useImagesColors(fallbackUrls);

  return useMemo(
    () =>
      map(
        assets,
        (asset, index) =>
          asset.color ||
          fallbackColors[index] ||
          pseudoRandomArrayItemFromString(asset.symbol, colors.avatarColor)
      ),
    [assets, fallbackColors]
  );
}

export default function useColorForAsset({ address, color, symbol }) {
  const fallbackUrl = useMemo(() => getUrlForTrustIconFallback(address), [
    address,
  ]);

  const { color: fallbackColor } = useImageMetadata(fallbackUrl);

  return useMemo(
    () =>
      color ||
      fallbackColor ||
      pseudoRandomArrayItemFromString(symbol, colors.avatarColor),
    [color, fallbackColor, symbol]
  );
}
