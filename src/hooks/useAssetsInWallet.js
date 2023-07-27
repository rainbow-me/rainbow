import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '@/helpers/assetSelectors';
import { checkIfNetworkIsEnabled } from '@/networks';
import ethereumUtils from '@/utils/ethereumUtils';

const useAssetsInWallet = () => {
  const { sortedAssets } = useSelector(sortAssetsByNativeAmountSelector);

  return sortedAssets.filter(asset =>
    checkIfNetworkIsEnabled(ethereumUtils.getNetworkFromType(asset?.type))
  );
};

export default useAssetsInWallet;
