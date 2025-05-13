import { hasNftOffers as hasNftOffersApi } from '@/resources/nfts';
import { useWalletsStore } from '@/redux/wallets';

export const hasNftOffers = async () => {
  const { accountAddress } = useWalletsStore.getState();

  try {
    return accountAddress ? hasNftOffersApi(accountAddress) : false;
  } catch (e) {
    return false;
  }
};
