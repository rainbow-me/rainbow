import { LIGHTER_HOSTNAMES, LIGHTER_REFERRAL_CODE, LIGHTER_REFERRAL_PARAM } from '@/features/lighter/constants';

export function getLighterReferralUrl(url: string): string | null {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  if (!LIGHTER_HOSTNAMES.has(parsedUrl.hostname)) {
    return null;
  }

  if (!parsedUrl.searchParams.has(LIGHTER_REFERRAL_PARAM)) {
    parsedUrl.searchParams.set(LIGHTER_REFERRAL_PARAM, LIGHTER_REFERRAL_CODE);
  }

  return parsedUrl.toString();
}
