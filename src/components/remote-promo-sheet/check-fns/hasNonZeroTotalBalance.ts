import store from '@/redux/store';
import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers/networkTypes';
import { RainbowNetworks } from '@/networks';
import { ethereumUtils } from '@/utils';

export const hasNonZeroTotalBalance = async (): Promise<boolean> => {
  const {
    accountAddress,
  }: {
    accountAddress: EthereumAddress;
    network: Network;
  } = store.getState().settings;

  const networks: Network[] = RainbowNetworks.map(network => network.value);
  const balances = await Promise.all(
    networks.map(async network => {
      const nativeAsset = await ethereumUtils.getNativeAssetForNetwork(
        network,
        accountAddress
      );
      return Number(nativeAsset?.balance?.amount);
    })
  );

  return balances.some(balance => balance > 0);
};
