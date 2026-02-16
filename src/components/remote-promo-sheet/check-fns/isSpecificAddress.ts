import { ActionFn } from '@/components/remote-promo-sheet/checkForRemotePromoSheet';
import type { EthereumAddress } from '@/entities/wallet';
import { getAccountAddress } from '@/state/wallets/walletsStore';

type props = {
  addresses: EthereumAddress[];
};

export const isSpecificAddress: ActionFn<props> = async ({ addresses }) => {
  const accountAddress = getAccountAddress();
  return addresses.map(address => address.toLowerCase()).includes(accountAddress.toLowerCase());
};
