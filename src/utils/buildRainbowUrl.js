import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';

export default function buildRainbowUrl(asset, accountENS, accountAddress) {
  const address = accountENS || accountAddress;
  const family = asset.familyName;
  const assetId = asset.uniqueId;

  const url = `${RAINBOW_PROFILES_BASE_URL}/${address}?family=${family}&nft=${assetId}`;
  return url;
}
