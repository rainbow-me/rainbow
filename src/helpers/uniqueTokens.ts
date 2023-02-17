import { UniqueAsset } from '@/entities';
import { Network } from './networkTypes';

const POAP_ADDRESS = '0x22c1f6050e56d2876009903609a2cc3fef83b415';

export const filterNfts = (nfts: UniqueAsset[], polygonAllowlist: string[]) =>
  nfts.filter((nft: UniqueAsset) => {
    if (!nft.collection.name) return false;

    // filter out spam
    if (nft.spamScore === null || nft.spamScore >= 85) return false;

    // filter gnosis NFTs that are not POAPs
    if (
      nft.network === Network.gnosis &&
      nft.asset_contract &&
      nft?.asset_contract?.address?.toLowerCase() !== POAP_ADDRESS
    )
      return false;

    if (
      nft.network === Network.polygon &&
      !polygonAllowlist.includes(nft.asset_contract?.address?.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
