import { EthereumAddress, UniqueAsset } from '@/entities';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';

export function buildRainbowUrl(
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

export enum LearnUTMCampaign {
  none = 'none',
  card = 'card',
  explain = 'explain',
  settings = 'settings',
}

export function buildRainbowLearnUrl({
  url,
  campaign = LearnUTMCampaign.none,
  isDarkMode = false,
}: {
  url: string;
  campaign?: LearnUTMCampaign;
  isDarkMode?: boolean;
}): string {
  const UTM_CONSTANT = 'utm_source=rainbow-app&utm_medium=referral';

  let resultUrl = `${url}?${UTM_CONSTANT}`;

  if (campaign !== LearnUTMCampaign.none) {
    resultUrl = `${url}?${UTM_CONSTANT}&utm_campaign=${campaign}`;
  }

  if (isDarkMode) {
    resultUrl = `${resultUrl}&theme=dark`;
  }
  return resultUrl;
}
