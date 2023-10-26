import store from '@/redux/store';
import { ethereumUtils } from '@/utils';
import { EthereumAddress } from '@/entities';
import { ActionFn } from '../checkForCampaign';

type props = {
  assetAddress: EthereumAddress;
};

export const hasNonZeroAssetBalance: ActionFn<props> = async ({
  assetAddress,
}) => {
  const { selected } = store.getState().wallets;
  if (!selected) return false;

  const asset = ethereumUtils.getAccountAsset(assetAddress);
  if (!asset?.balance) return false;

  return Number(asset.balance.amount) > 0;
};
