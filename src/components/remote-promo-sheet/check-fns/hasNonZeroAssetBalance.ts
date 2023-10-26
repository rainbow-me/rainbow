import store from '@/redux/store';
import { ethereumUtils } from '@/utils';
import { EthereumAddress } from '@/entities';

export const hasNonZeroAssetBalance = async (
  assetAddress: EthereumAddress
): Promise<boolean> => {
  const { selected } = store.getState().wallets;
  if (!selected) return false;

  const asset = ethereumUtils.getAccountAsset(assetAddress);
  return Number(asset?.balance?.amount) > 0;
};
