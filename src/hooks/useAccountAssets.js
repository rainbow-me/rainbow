import { useDeepCompareMemo } from 'use-deep-compare';
import useDebounceSelector from './useDebounceSelector';
import { sortAssetsByNativeAmountSelector } from '@rainbow-me/helpers/assetSelectors';

export default function useAccountAssets() {
  const assets = useDebounceSelector(sortAssetsByNativeAmountSelector);
  const collectibles = useDebounceSelector(
    ({ uniqueTokens: { uniqueTokens } }) => uniqueTokens
  );

  return useDeepCompareMemo(
    () => ({
      ...assets,
      collectibles,
    }),
    [assets, collectibles]
  );
}
