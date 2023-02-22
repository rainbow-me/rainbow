import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '@/utils/assetSelectors';

export default function useSortedAccountAssets() {
  return useSelector(sortAssetsByNativeAmountSelector);
}
