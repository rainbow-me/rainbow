import store from '@/redux/store';
import { EthereumAddress } from '@/entities';
import { ActionFn } from '../checkForCampaign';
import { fetchUserAssets } from '@/resources/assets/UserAssetsQuery';

type props = {
  assetAddress: EthereumAddress;
};

export const hasNonZeroAssetBalance: ActionFn<props> = async ({
  assetAddress,
}) => {
  const { accountAddress, nativeCurrency } = store.getState().settings;

  const assets = await fetchUserAssets({
    address: accountAddress,
    currency: nativeCurrency,
    connectedToHardhat: false,
  });
  if (!assets || Object.keys(assets).length === 0) return false;

  const desiredAsset = Object.values(assets).find(
    asset => asset.address.toLowerCase() === assetAddress.toLowerCase()
  );
  if (!desiredAsset) return false;

  return Number(desiredAsset.balance?.amount) > 0;
};
