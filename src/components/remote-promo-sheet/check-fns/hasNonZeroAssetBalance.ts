import store from '@/redux/store';
import { EthereumAddress } from '@/entities';
import { ActionFn } from '../checkForCampaign';
import { fetchUserAssets } from '@/resources/assets/UserAssetsQuery';
import { Network } from '@/helpers';

type props = {
  assetAddress: EthereumAddress;
  network?: Network;
};

export const hasNonZeroAssetBalance: ActionFn<props> = async ({ assetAddress, network }) => {
  const { accountAddress, nativeCurrency } = store.getState().settings;

  const assets = await fetchUserAssets({
    address: accountAddress,
    currency: nativeCurrency,
    connectedToHardhat: false,
  });
  if (!assets || Object.keys(assets).length === 0) return false;

  const desiredAsset = Object.values(assets).find(asset => {
    if (!network) {
      return asset.uniqueId.toLowerCase() === assetAddress.toLowerCase();
    }

    return asset.uniqueId.toLowerCase() === assetAddress.toLowerCase() && asset.network === network;
  });
  if (!desiredAsset) return false;

  return Number(desiredAsset.balance?.amount) > 0;
};
