import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '@/helpers/assetSelectors';
import { checkIfNetworkIsEnabled } from '@/networks';
import { ethereumUtils } from '@/utils';

export default function useSortedAccountAssets() {
  const assetsData = useSelector(sortAssetsByNativeAmountSelector);
  return {
    isLoadingAssets: assetsData.isLoadingAssets,
    sortedAssets: assetsData?.sortedAssets?.filter((asset: any) =>
      checkIfNetworkIsEnabled(ethereumUtils.getNetworkFromType(asset.type))
    ),
  };
}
