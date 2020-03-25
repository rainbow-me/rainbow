import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';

export default function useAccountAssets() {
  return useSelector(sortAssetsByNativeAmountSelector);
}
