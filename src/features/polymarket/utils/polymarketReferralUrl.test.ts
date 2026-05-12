import { getPolymarketReferralUrl } from '@/features/polymarket/utils/polymarketReferralUrl';

// Unfortunately @/features/polymarket/constants has some imports, so we need to mock it
jest.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_HOSTNAMES: new Set(['polymarket.com', 'www.polymarket.com']),
  POLYMARKET_REFERRAL_CODE: 'rnbw',
  POLYMARKET_REFERRAL_PARAM: 'r',
}));

describe('getPolymarketReferralUrl', () => {
  it('adds the Polymarket referral query param', () => {
    expect(getPolymarketReferralUrl('https://polymarket.com/event/some-market?foo=bar#activity')).toBe(
      'https://polymarket.com/event/some-market?foo=bar&r=rnbw#activity'
    );
  });

  it('does not replace an existing Polymarket referral query param', () => {
    expect(getPolymarketReferralUrl('https://polymarket.com/?r=existing')).toBe('https://polymarket.com/?r=existing');
  });

  it('supports the www Polymarket hostname', () => {
    expect(getPolymarketReferralUrl('https://www.polymarket.com/event/some-market')).toBe(
      'https://www.polymarket.com/event/some-market?r=rnbw'
    );
  });

  it('ignores unrelated URLs and invalid input', () => {
    expect(getPolymarketReferralUrl('https://example.com')).toBeNull();
    expect(getPolymarketReferralUrl('not a url')).toBeNull();
  });
});
