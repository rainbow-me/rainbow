import store from '@/redux/store';
import { RainbowNetworks } from '@/networks';
import { ethereumUtils } from '@/utils';
import { EthereumAddress } from '@/entities';

export const hasNonZeroAssetBalance = async (
  assetAddress: EthereumAddress
): Promise<boolean> => {
  const { selected } = store.getState().wallets;
  if (!selected) return false;

  const networks = RainbowNetworks.map(network => network.value);

  // check native asset balances on networks
  const balancePromises = networks.map(network =>
    ethereumUtils
      .getNativeAssetForNetwork(network, assetAddress)
      .then(nativeAsset => Number(nativeAsset?.balance?.amount) > 0)
      .catch(() => {
        return false;
      })
  );

  for (const balancePromise of balancePromises) {
    // eslint-disable-next-line no-await-in-loop
    if (await balancePromise) {
      return true;
    }
  }

  return false;
};
