import { EthereumAddress, UniqueAsset } from '@/entities';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';

export default function buildRainbowUrl(
  asset: UniqueAsset | null,
  accountENS: string,
  accountAddress: EthereumAddress
): string {
  const address = accountENS || accountAddress;
  const slug = asset?.collection?.slug;
  const assetId = asset?.uniqueId;

  const familyString = slug ? `?family=${slug}` : '';
  const assetString =
    slug && assetId?.toString() ? `&nft=${assetId?.toString()}` : '';

  const url = `${RAINBOW_PROFILES_BASE_URL}/${address}${familyString}${assetString}`;
  return url;
}
