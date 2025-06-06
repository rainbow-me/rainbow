import { EthereumAddress, UniqueAsset } from '@/entities';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';
import { qs } from 'url-parse';

export function parseCollectionSlugFromUrl(url: string) {
  if (!url.trim()) {
    return '';
  }

  const urlObj = new URL(url);
  const paths = urlObj.pathname.split('/');
  let slug = '';
  for (const path of paths) {
    if (path.toLowerCase() === 'collection') {
      slug = paths[paths.indexOf(path) + 1];
      break;
    }
  }
  return slug;
}

export function buildRainbowUrl(asset: UniqueAsset | null, accountENS: string, accountAddress: EthereumAddress): string {
  if (!asset) {
    return '';
  }

  const { uniqueId, network, collectionUrl } = asset;

  const address = accountENS || accountAddress;
  const slug = parseCollectionSlugFromUrl(collectionUrl ?? '');

  const networkName = network ? (network + '_').replace('mainnet', 'ethereum') : '';

  const familyString = slug ? `?family=${slug}` : '';
  const assetString = uniqueId ? `&nft=${networkName}${uniqueId}` : '';

  const url = `${RAINBOW_PROFILES_BASE_URL}/profile/${address}${familyString}${assetString}`;
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
