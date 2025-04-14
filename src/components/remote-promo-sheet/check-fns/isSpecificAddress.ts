import { ActionFn } from '@/components/remote-promo-sheet/checkForRemotePromoSheet';
import { EthereumAddress } from '@/entities';
import { getAccountAddress } from '../../../redux/wallets';

type props = {
  addresses: EthereumAddress[];
};

export const isSpecificAddress: ActionFn<props> = async ({ addresses }) => {
  const accountAddress = getAccountAddress();
  return addresses.map(address => address.toLowerCase()).includes(accountAddress.toLowerCase());
};
