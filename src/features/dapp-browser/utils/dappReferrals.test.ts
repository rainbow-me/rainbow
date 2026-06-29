import { addReferralToDappBrowserUrl } from './dappReferrals';

describe('addReferralToDappBrowserUrl', () => {
  describe('Polymarket', () => {
    it('injects the referral param', () => {
      expect(addReferralToDappBrowserUrl('https://polymarket.com/event/some-market')).toBe(
        'https://polymarket.com/event/some-market?r=rnbw'
      );
    });

    it('preserves existing query params and the fragment', () => {
      expect(addReferralToDappBrowserUrl('https://polymarket.com/event/some-market?foo=bar#activity')).toBe(
        'https://polymarket.com/event/some-market?foo=bar&r=rnbw#activity'
      );
    });

    it('matches the www hostname', () => {
      expect(addReferralToDappBrowserUrl('https://www.polymarket.com/event/x')).toBe('https://www.polymarket.com/event/x?r=rnbw');
    });

    it('does not replace an existing referral param', () => {
      expect(addReferralToDappBrowserUrl('https://www.polymarket.com/?r=existing')).toBe('https://www.polymarket.com/?r=existing');
    });
  });

  describe('Lighter', () => {
    it('injects the referral param, preserving query and fragment', () => {
      expect(addReferralToDappBrowserUrl('https://app.lighter.xyz/trade?foo=bar#positions')).toBe(
        'https://app.lighter.xyz/trade?foo=bar&referral=7228476M#positions'
      );
    });

    it('matches the bare and www hostnames', () => {
      expect(addReferralToDappBrowserUrl('https://lighter.xyz/trade')).toBe('https://lighter.xyz/trade?referral=7228476M');
      expect(addReferralToDappBrowserUrl('https://www.lighter.xyz/trade')).toBe('https://www.lighter.xyz/trade?referral=7228476M');
    });

    it('does not replace an existing referral param', () => {
      expect(addReferralToDappBrowserUrl('https://app.lighter.xyz/?referral=existing')).toBe('https://app.lighter.xyz/?referral=existing');
    });
  });

  describe('non-referral URLs', () => {
    it('returns the original URL when the host has no referral', () => {
      expect(addReferralToDappBrowserUrl('https://example.com/somewhere')).toBe('https://example.com/somewhere');
    });

    it('returns the original string for an unparseable URL', () => {
      expect(addReferralToDappBrowserUrl('not a url')).toBe('not a url');
    });

    it('does not match a deeper subdomain that is not in the host list', () => {
      expect(addReferralToDappBrowserUrl('https://foo.lighter.xyz/trade')).toBe('https://foo.lighter.xyz/trade');
    });
  });
});
