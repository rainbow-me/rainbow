import store from '@/redux/store';
import { EthereumAddress } from '@/entities';
import { ActionFn } from '../checkForCampaign';
import { Network } from '@/helpers';
import { userAssetsFetchQuery } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import { selectorFilterByUserChains, selectUserAssetsList } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';

type props = {
  assetAddress: EthereumAddress;
  network?: Network;
};

export const hasNonZeroAssetBalance: ActionFn<props> = async ({ assetAddress, network }) => {
  const { accountAddress, nativeCurrency } = store.getState().settings;

  const userAssetsDictByChain = await userAssetsFetchQuery({
    address: accountAddress,
    currency: nativeCurrency,
    testnetMode: false,
  });

  const assets = selectorFilterByUserChains({ data: userAssetsDictByChain, selector: selectUserAssetsList });
  if (!assets || assets.length === 0) return false;

  const desiredAsset = assets.find(asset => {
    if (!network) {
      return asset.uniqueId.toLowerCase() === assetAddress.toLowerCase();
    }

    const assetNetwork = getNetworkFromChainId(asset.chainId);
    return asset.uniqueId.toLowerCase() === assetAddress.toLowerCase() && assetNetwork === network;
  });
  if (!desiredAsset) return false;

  return Number(desiredAsset.balance?.amount) > 0;
};
