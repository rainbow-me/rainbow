import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';
import { uniqueTokensSelector } from '../hoc/uniqueTokenSelectors';
import { useSelector } from '@rainbow-me/react-redux';

export default function useAccountAssets() {
  const assets = useSelector(sortAssetsByNativeAmountSelector);
  const collectibles = useSelector(uniqueTokensSelector);

  return {
    ...assets,
    collectibles,
  };
}
