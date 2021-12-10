import { EthereumAddress, UniqueAsset } from '@rainbow-me/entities';
import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';

export default function buildRainbowUrl(
  asset: UniqueAsset | null,
  accountENS: string,
  accountAddress: EthereumAddress
): string {
  const address = accountENS || accountAddress;
  const family = asset?.familyName;
  const assetId = asset?.uniqueId;

  const familyString = family ? `?family=${family}` : '';
  const assetString =
    family && assetId?.toString() ? `&nft=${assetId?.toString()}` : '';

  const url = `${RAINBOW_PROFILES_BASE_URL}/${address}${familyString}${assetString}`;
  return url;
}
