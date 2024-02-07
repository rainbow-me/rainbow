import { EthereumAddress, UniqueAsset } from '@/entities';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';
import { qs } from 'url-parse';

export function buildRainbowUrl(asset: UniqueAsset | null, accountENS: string, accountAddress: EthereumAddress): string {
  const address = accountENS || accountAddress;
  const slug = asset?.collection?.slug;
  const assetId = asset?.uniqueId;

  const familyString = slug ? `?family=${slug}` : '';
  const assetString = slug && assetId?.toString() ? `&nft=${assetId?.toString()}` : '';

  const url = `${RAINBOW_PROFILES_BASE_URL}/${address}${familyString}${assetString}`;
  return url;
}

export enum LearnUTMCampaign {
  None = 'none',
  Card = 'card',
  Explain = 'explain',
  Settings = 'settings',
}

export function buildRainbowLearnUrl({
  url,
  query,
}: {
  url: string;
  query: {
    isDarkMode?: boolean;
    campaign?: LearnUTMCampaign;
    [key: string]: string | number | boolean | undefined;
  };
}) {
  const defaultUTM = {
    utm_medium: 'referral',
    utm_source: 'rainbow-app',
  };

  const q = qs.stringify({ ...defaultUTM, ...query });
  return url + '?' + q;
}
