import store from '@/redux/store';
import { fetchNftOffers } from '@/resources/reservoir/nftOffersQuery';

export async function hasNftOffers(): Promise<boolean> {
  const { accountAddress } = store.getState().settings;

  try {
    const data = await fetchNftOffers({ walletAddress: accountAddress });
    if (!data?.nftOffers) return false;

    return data?.nftOffers?.length > 1;
  } catch (e) {
    return false;
  }
}
