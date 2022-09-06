import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '@/helpers/assetSelectors';

export default function useSortedAccountAssets() {
  return useSelector(sortAssetsByNativeAmountSelector);
}
