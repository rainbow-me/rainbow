import { calculateFeeToCollectUsd, calculateTradeFeeUsd, getTradeFeeAmount } from './polymarketTradeFee';

jest.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_PUSD_DECIMALS: 6,
}));

describe('polymarketTradeFee', () => {
  it('charges the Custom 3%/0.14x fee from price and notional', () => {
    expect(calculateTradeFeeUsd({ notionalUsd: '5', price: '0.05' })).toBe('0.15');
    expect(calculateTradeFeeUsd({ notionalUsd: '50', price: '0.5' })).toBe('1.5');
    expect(calculateTradeFeeUsd({ notionalUsd: '90', price: '0.9' })).toBe('1.26');
    expect(calculateTradeFeeUsd({ notionalUsd: '95', price: '0.95' })).toBe('0.665');
    expect(calculateTradeFeeUsd({ notionalUsd: '99', price: '0.99' })).toBe('0.1386');
  });

  it('calculates the fee to collect from matched amounts and the quoted fee', () => {
    expect(calculateFeeToCollectUsd({ matchedAmounts: { tokens: '100', usd: '90' }, quotedFeeUsd: '2' })).toBe('1.26');
    expect(calculateFeeToCollectUsd({ matchedAmounts: { tokens: '100', usd: '90' }, quotedFeeUsd: '1' })).toBe('1');
    expect(calculateFeeToCollectUsd({ matchedAmounts: { tokens: '0', usd: '10' }, quotedFeeUsd: '1' })).toBe('0');
    expect(calculateFeeToCollectUsd({ matchedAmounts: { tokens: '100', usd: '90' }, quotedFeeUsd: '0' })).toBe('0');
  });

  it('converts the fee to six-decimal collateral units', () => {
    expect(getTradeFeeAmount('0.123456789').toString()).toBe('123456');
  });
});
