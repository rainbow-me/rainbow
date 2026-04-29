import { getLighterReferralUrl } from '@/features/lighter/utils/lighterReferralUrl';

describe('getLighterReferralUrl', () => {
  it('adds the Lighter referral query param', () => {
    expect(getLighterReferralUrl('https://app.lighter.xyz/trade?foo=bar#positions')).toBe(
      'https://app.lighter.xyz/trade?foo=bar&referral=7228476M#positions'
    );
  });

  it('does not replace an existing Lighter referral query param', () => {
    expect(getLighterReferralUrl('https://app.lighter.xyz/?referral=existing')).toBe('https://app.lighter.xyz/?referral=existing');
  });

  it('supports lighter.xyz and www.lighter.xyz hostnames', () => {
    expect(getLighterReferralUrl('https://lighter.xyz/trade')).toBe('https://lighter.xyz/trade?referral=7228476M');
    expect(getLighterReferralUrl('https://www.lighter.xyz/trade')).toBe('https://www.lighter.xyz/trade?referral=7228476M');
  });

  it('returns null for non-Lighter URLs or invalid URLs', () => {
    expect(getLighterReferralUrl('https://example.com')).toBeNull();
    expect(getLighterReferralUrl('not a url')).toBeNull();
  });
});
