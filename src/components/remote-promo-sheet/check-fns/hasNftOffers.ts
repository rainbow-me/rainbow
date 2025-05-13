import { fetchNftOffers } from '@/resources/reservoir/nftOffersQuery';
import { getAccountAddress } from '@/state/wallets/walletsStore';

export async function hasNftOffers(): Promise<boolean> {
  const accountAddress = getAccountAddress();

  try {
    const data = await fetchNftOffers({ walletAddress: accountAddress });
    if (!data?.nftOffers) return false;

    return data?.nftOffers?.length > 1;
  } catch (e) {
    return false;
  }
}
