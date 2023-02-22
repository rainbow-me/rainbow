import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '@/utils/assetSelectors';

const useAssetsInWallet = () => {
  const { sortedAssets } = useSelector(sortAssetsByNativeAmountSelector);
  return sortedAssets;
};

export default useAssetsInWallet;
