import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '@/helpers/assetSelectors';

const useAssetsInWallet = () => {
  const { sortedAssets } = useSelector(sortAssetsByNativeAmountSelector);
  return sortedAssets;
};

export default useAssetsInWallet;
