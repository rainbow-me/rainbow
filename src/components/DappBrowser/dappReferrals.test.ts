import { addReferralToDappBrowserUrl } from '@/components/DappBrowser/dappReferrals';

// Unfortunately @/features/polymarket/constants has some imports, so we need to mock it
jest.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_HOSTNAMES: new Set(['polymarket.com', 'www.polymarket.com']),
  POLYMARKET_REFERRAL_CODE: 'referrals',
  POLYMARKET_REFERRAL_PARAM: 'r',
}));

describe('dappReferrals', () => {
  it('returns the referral URL when a browser referral applies', () => {
    expect(addReferralToDappBrowserUrl('https://polymarket.com/event/some-market')).toBe(
      'https://polymarket.com/event/some-market?r=referrals'
    );
  });

  it('returns the original URL when no browser referral applies', () => {
    expect(addReferralToDappBrowserUrl('https://example.com/somewhere')).toBe('https://example.com/somewhere');
  });

  it('returns the original URL when a browser referral already exists', () => {
    expect(addReferralToDappBrowserUrl('https://www.polymarket.com/?r=existing')).toBe('https://www.polymarket.com/?r=existing');
  });

  it('returns the Lighter referral URL when a browser referral applies', () => {
    expect(addReferralToDappBrowserUrl('https://app.lighter.xyz/trade')).toBe('https://app.lighter.xyz/trade?referral=7228476M');
  });

  it('returns the original URL when a Lighter referral already exists', () => {
    expect(addReferralToDappBrowserUrl('https://app.lighter.xyz/?referral=existing')).toBe('https://app.lighter.xyz/?referral=existing');
  });
});
