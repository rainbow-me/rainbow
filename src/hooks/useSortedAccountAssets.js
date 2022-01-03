import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '@rainbow-me/helpers/assetSelectors';

export default function useSortedAccountAssets() {
  return useSelector(sortAssetsByNativeAmountSelector);
}
