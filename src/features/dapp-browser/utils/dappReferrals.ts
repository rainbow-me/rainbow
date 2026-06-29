type DappReferral = {
  hostnames: ReadonlySet<string>;
  param: string;
  code: string;
};

const DAPP_REFERRALS: DappReferral[] = [
  { hostnames: new Set(['polymarket.com', 'www.polymarket.com']), param: 'r', code: 'rnbw' },
  { hostnames: new Set(['app.lighter.xyz', 'lighter.xyz', 'www.lighter.xyz']), param: 'referral', code: '7228476M' },
];

export function addReferralToDappBrowserUrl(url: string): string {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return url;
  }

  const referral = DAPP_REFERRALS.find(({ hostnames }) => hostnames.has(parsedUrl.hostname));
  if (!referral) return url;

  if (!parsedUrl.searchParams.has(referral.param)) {
    parsedUrl.searchParams.set(referral.param, referral.code);
  }

  return parsedUrl.toString();
}
