import { calculatePolymarketManualFeeUsd, capPolymarketManualFeeUsd, getPolymarketManualFeeAmount } from './polymarketManualFee';

jest.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_PUSD_DECIMALS: 6,
  POLYMARKET_RAINBOW_FEE_USD_PER_TOKEN: '0.01',
}));

describe('polymarketManualFee', () => {
  it('charges one cent per matched token', () => {
    expect(calculatePolymarketManualFeeUsd('12.345')).toBe('0.12345');
  });

  it('caps collection to the reserved fee amount', () => {
    expect(capPolymarketManualFeeUsd({ feeUsd: '0.25', maxFeeUsd: '0.1' })).toBe('0.1');
    expect(capPolymarketManualFeeUsd({ feeUsd: '0.25', maxFeeUsd: '0' })).toBe('0');
  });

  it('converts the fee to six-decimal collateral units', () => {
    expect(getPolymarketManualFeeAmount('0.123456789').toString()).toBe('123456');
  });
});
