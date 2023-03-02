import { UniqueAsset } from '@/entities';
import { POAP_NFT_ADDRESS } from '@/references';
import { Network } from './networkTypes';

export const filterNfts = (nfts: UniqueAsset[], polygonAllowlist: string[]) =>
  nfts.filter((nft: UniqueAsset) => {
    if (!nft.collection.name) return false;

    // filter out spam
    if (
      nft.collection.simplehashSpamScore === null ||
      nft.collection.simplehashSpamScore >= 85
    )
      return false;

    // filter gnosis NFTs that are not POAPs
    if (
      nft.network === Network.gnosis &&
      nft.contract &&
      nft?.contract?.address?.toLowerCase() !== POAP_NFT_ADDRESS
    )
      return false;

    if (
      nft.network === Network.polygon &&
      !polygonAllowlist.includes(nft.contract?.address?.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
