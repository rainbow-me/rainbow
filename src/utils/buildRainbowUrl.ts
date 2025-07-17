import { EthereumAddress, UniqueAsset } from '@/entities';
import { logger, RainbowError } from '@/logger';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';
import { qs } from 'url-parse';

export function parseCollectionSlugFromUrl(url: string) {
  if (!url.trim()) {
    return '';
  }

  const urlObj = new URL(url);
  const paths = urlObj.pathname.split('/');
  let slug = '';
  for (const [index, path] of paths.entries()) {
    if (path.toLowerCase() === 'collection') {
      slug = paths[index + 1];
      break;
    }
  }
  return slug;
}

export function buildRainbowUrl(asset: UniqueAsset | null, accountENS: string, accountAddress: EthereumAddress): string {
  try {
    if (!asset) {
      return '';
    }

    const { uniqueId, collectionUrl } = asset;

    const address = accountENS || accountAddress;

    const slug = parseCollectionSlugFromUrl(collectionUrl ?? '');
    const familyString = slug ? `?family=${slug}` : '';
    const assetString = uniqueId ? `&nft=${uniqueId.replace('mainnet', 'ethereum')}` : '';
    const url = `${RAINBOW_PROFILES_BASE_URL}/profile/${address}${familyString}${assetString}`;

    return url;
  } catch (error) {
    logger.error(new RainbowError(`Failed to build Rainbow URL`, error), {
      asset,
      accountENS,
      accountAddress,
    });

    return '';
  }
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
