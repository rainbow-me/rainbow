import { EthereumAddress } from '@/entities';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';
import { NFT, NFTMarketplaceId } from '@/resources/nfts/types';

export default function buildRainbowUrl(
  asset: NFT | null,
  accountENS: string,
  accountAddress: EthereumAddress
): string {
  const address = accountENS || accountAddress;
  const slug = asset?.marketplaces?.filter(
    marketplace => marketplace.marketplaceId === NFTMarketplaceId.OpenSea
  )?.[0]?.collectionId;
  const assetId = asset?.uniqueId;

  const familyString = slug ? `?family=${slug}` : '';
  const assetString =
    slug && assetId?.toString() ? `&nft=${assetId?.toString()}` : '';

  const url = `${RAINBOW_PROFILES_BASE_URL}/${address}${familyString}${assetString}`;
  return url;
}
