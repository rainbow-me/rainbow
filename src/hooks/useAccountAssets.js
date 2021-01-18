import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';

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
