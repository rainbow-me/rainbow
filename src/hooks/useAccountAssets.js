import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';
import { uniqueTokensSelector } from '../hoc/uniqueTokenSelectors';

export default function useAccountAssets() {
  const assets = useSelector(sortAssetsByNativeAmountSelector);
  const collectibles = useSelector(uniqueTokensSelector);

  return {
    ...assets,
    collectibles,
  };
}
