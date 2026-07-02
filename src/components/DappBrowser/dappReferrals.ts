import { getDappHostname } from '@/features/dapp/utils/dappUrls';
import { LIGHTER_HOSTNAMES } from '@/features/lighter/constants';
import { getLighterReferralUrl } from '@/features/lighter/utils/lighterReferralUrl';
import { POLYMARKET_HOSTNAMES } from '@/features/polymarket/constants';
import { getPolymarketReferralUrl } from '@/features/polymarket/utils/polymarketReferralUrl';

type DappReferral = {
  getUrl: (url: string) => string | null;
  hostnames: ReadonlySet<string>;
};

const DAPP_REFERRALS: DappReferral[] = [
  { hostnames: POLYMARKET_HOSTNAMES, getUrl: getPolymarketReferralUrl },
  { hostnames: LIGHTER_HOSTNAMES, getUrl: getLighterReferralUrl },
];

export function addReferralToDappBrowserUrl(url: string): string {
  const hostname = getDappHostname(url);
  if (!hostname) return url;

  const referral = DAPP_REFERRALS.find(({ hostnames }) => hostnames.has(hostname));
  const referralUrl = referral?.getUrl(url);

  if (!referral || !referralUrl) return url;

  return referralUrl;
}
