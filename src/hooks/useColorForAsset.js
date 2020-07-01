import { useMemo } from 'react';
import {
  getUrlForTrustIconFallback,
  pseudoRandomArrayItemFromString,
} from '../utils';
import useImageMetadata from './useImageMetadata';
import { colors } from '@rainbow-me/styles';

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
