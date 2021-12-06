import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '@rainbow-me/helpers/assetSelectors';

export default function useAccountAssets() {
  const assets = useSelector(sortAssetsByNativeAmountSelector);
  const collectibles = useSelector(
    ({ uniqueTokens: { uniqueTokens } }) => uniqueTokens
  );

  return {
    ...assets,
    collectibles,
  };
}
