import store from '@/redux/store';
import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers/networkTypes';
import { RainbowNetworks } from '@/networks';
import { getAccountEmptyState } from '@/handlers/localstorage/accountLocal';

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
      const isAccountEmptyInStorage = getAccountEmptyState(
        accountAddress,
        network
      );

      return isAccountEmptyInStorage ?? true;
    })
  );

  return balances.some(balance => !balance);
};
