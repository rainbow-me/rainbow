// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';

export default function buildRainbowUrl(
  asset: any,
  accountENS: any,
  accountAddress: any
) {
  const address = accountENS || accountAddress;
  const family = asset?.familyName;
  const assetId = asset?.uniqueId;

  const familyString = family ? `?family=${family}` : '';
  const assetString =
    family && assetId?.toString() ? `&nft=${assetId?.toString()}` : '';

  const url = `${RAINBOW_PROFILES_BASE_URL}/${address}${familyString}${assetString}`;
  return url;
}
