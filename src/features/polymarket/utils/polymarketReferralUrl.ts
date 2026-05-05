import { POLYMARKET_HOSTNAMES, POLYMARKET_REFERRAL_CODE, POLYMARKET_REFERRAL_PARAM } from '@/features/polymarket/constants';

export function getPolymarketReferralUrl(url: string): string | null {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  if (!POLYMARKET_HOSTNAMES.has(parsedUrl.hostname)) {
    return null;
  }

  if (!parsedUrl.searchParams.has(POLYMARKET_REFERRAL_PARAM)) {
    parsedUrl.searchParams.set(POLYMARKET_REFERRAL_PARAM, POLYMARKET_REFERRAL_CODE);
  }

  return parsedUrl.toString();
}
