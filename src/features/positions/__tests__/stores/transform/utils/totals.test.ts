import {
  calculatePositionTotals,
  calculateGrandTotals,
  calculateTotalValue,
  calculateTokenNativeDisplay,
} from '../../../../stores/transform/utils/totals';
import type { RainbowPosition, RainbowUnderlyingAsset, PositionAsset, PositionToken } from '../../../../types';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { NativeCurrencyKey } from '@/entities';

describe('calculateTotalValue', () => {
  const createMockAsset = (amount: string): RainbowUnderlyingAsset => ({
    asset: {
      chainId: 1,
      address: '0x123',
      symbol: 'TEST',
      name: 'Test Token',
      decimals: 18,
      chain_id: 1,
      icon_url: '',
      price: {
        value: 1,
        changed_at: Date.now(),
        relative_change_24h: 0,
      },
      colors: undefined,
    } as unknown as PositionAsset,
    quantity: '1',
    native: {
      amount,
      display: `$${amount}`,
    },
  });

  it('should calculate total value from underlying assets', () => {
    const underlying = [createMockAsset('100'), createMockAsset('200'), createMockAsset('300')];

    const total = calculateTotalValue(underlying);
    expect(total).toBe('600');
  });

  it('should handle empty array', () => {
    const total = calculateTotalValue([]);
    expect(total).toBe('0');
  });

  it('should handle single asset', () => {
    const underlying = [createMockAsset('123.45')];
    const total = calculateTotalValue(underlying);
    expect(total).toBe('123.45');
  });

  it('should handle decimal values', () => {
    const underlying = [createMockAsset('10.25'), createMockAsset('20.75'), createMockAsset('0.50')];

    const total = calculateTotalValue(underlying);
    expect(total).toBe('31.5');
  });

  it('should handle missing native amounts', () => {
    const underlying = [
      createMockAsset('100'),
      {
        ...createMockAsset('0'),
        native: { amount: undefined as any, display: '$0' },
      },
      createMockAsset('50'),
    ];

    const total = calculateTotalValue(underlying);
    expect(total).toBe('150');
  });

  it('should handle negative values', () => {
    const underlying = [createMockAsset('100'), createMockAsset('-50'), createMockAsset('25')];

    const total = calculateTotalValue(underlying);
    expect(total).toBe('75');
  });
});

describe('calculatePositionTotals', () => {
  const createMockPosition = (): RainbowPosition => ({
    type: 'Test Protocol',
    chainIds: [1],
    deposits: [],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
    totals: {
      total: {
        amount: '0',
        display: convertAmountToNativeDisplay('0', 'USD' as NativeCurrencyKey),
      },
      totalDeposits: {
        amount: '0',
        display: convertAmountToNativeDisplay('0', 'USD' as NativeCurrencyKey),
      },
      totalBorrows: {
        amount: '0',
        display: convertAmountToNativeDisplay('0', 'USD' as NativeCurrencyKey),
      },
      totalRewards: {
        amount: '0',
        display: convertAmountToNativeDisplay('0', 'USD' as NativeCurrencyKey),
      },
      totalLocked: {
        amount: '0',
        display: convertAmountToNativeDisplay('0', 'USD' as NativeCurrencyKey),
      },
    },
    dapp: {
      name: 'Test',
      url: '',
      icon_url: '',
      colors: { primary: '#000', fallback: '#000', shadow: '#000' },
    },
  });

  it('should calculate totals for position with deposits', () => {
    const position = createMockPosition();
    position.deposits = [{ totalValue: '100' } as any, { totalValue: '200' } as any];

    calculatePositionTotals(position, 'USD');

    expect(position.totals.totalDeposits.amount).toBe('300');
    expect(position.totals.totalBorrows.amount).toBe('0');
    expect(position.totals.totalRewards.amount).toBe('0');
    expect(position.totals.total.amount).toBe('300');
  });

  it('should calculate totals for position with pools', () => {
    const position = createMockPosition();
    position.pools = [{ totalValue: '500' } as any, { totalValue: '300' } as any];

    calculatePositionTotals(position, 'USD');

    expect(position.totals.totalDeposits.amount).toBe('800');
    expect(position.totals.total.amount).toBe('800');
  });

  it('should calculate totals for position with stakes', () => {
    const position = createMockPosition();
    position.stakes = [{ totalValue: '150' } as any, { totalValue: '250' } as any];

    calculatePositionTotals(position, 'USD');

    expect(position.totals.totalDeposits.amount).toBe('400');
    expect(position.totals.total.amount).toBe('400');
  });

  it('should calculate totals for position with borrows', () => {
    const position = createMockPosition();
    position.deposits = [{ totalValue: '1000' } as any];
    position.borrows = [{ totalValue: '300' } as any, { totalValue: '200' } as any];

    calculatePositionTotals(position, 'USD');

    expect(position.totals.totalDeposits.amount).toBe('1000');
    expect(position.totals.totalBorrows.amount).toBe('500');
    expect(position.totals.total.amount).toBe('500'); // 1000 - 500
  });

  it('should calculate totals for position with rewards', () => {
    const position = createMockPosition();
    position.deposits = [{ totalValue: '1000' } as any];
    position.rewards = [{ totalValue: '50' } as any, { totalValue: '25' } as any];

    calculatePositionTotals(position, 'USD');

    expect(position.totals.totalDeposits.amount).toBe('1000');
    expect(position.totals.totalRewards.amount).toBe('75');
    expect(position.totals.total.amount).toBe('1075'); // 1000 + 75
  });

  it('should calculate complex position correctly', () => {
    const position = createMockPosition();
    position.deposits = [{ totalValue: '500' } as any];
    position.pools = [{ totalValue: '1000' } as any];
    position.stakes = [{ totalValue: '300' } as any];
    position.borrows = [{ totalValue: '400' } as any];
    position.rewards = [{ totalValue: '100' } as any];

    calculatePositionTotals(position, 'USD');

    expect(position.totals.totalDeposits.amount).toBe('1800'); // 500 + 1000 + 300
    expect(position.totals.totalBorrows.amount).toBe('400');
    expect(position.totals.totalRewards.amount).toBe('100');
    expect(position.totals.total.amount).toBe('1500'); // (1800 + 100) - 400
  });

  it('should handle missing totalValue properties', () => {
    const position = createMockPosition();
    position.deposits = [{ totalValue: '100' } as any, { totalValue: undefined } as any, { totalValue: '200' } as any];

    calculatePositionTotals(position, 'USD');

    expect(position.totals.totalDeposits.amount).toBe('300');
  });

  it('should handle empty position', () => {
    const position = createMockPosition();
    calculatePositionTotals(position, 'USD');

    expect(position.totals.totalDeposits.amount).toBe('0');
    expect(position.totals.totalBorrows.amount).toBe('0');
    expect(position.totals.totalRewards.amount).toBe('0');
    expect(position.totals.total.amount).toBe('0');
  });

  it('should handle negative net value', () => {
    const position = createMockPosition();
    position.deposits = [{ totalValue: '100' } as any];
    position.borrows = [{ totalValue: '500' } as any];

    calculatePositionTotals(position, 'USD');

    expect(position.totals.total.amount).toBe('-400');
  });
});

describe('calculateGrandTotals', () => {
  const createMockPositionWithTotals = (deposits: string, borrows: string, rewards: string, total: string): RainbowPosition => ({
    type: 'Test Protocol',
    chainIds: [1],
    deposits: [],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
    totals: {
      total: {
        amount: total,
        display: convertAmountToNativeDisplay(total, 'USD' as NativeCurrencyKey),
      },
      totalDeposits: {
        amount: deposits,
        display: convertAmountToNativeDisplay(deposits, 'USD' as NativeCurrencyKey),
      },
      totalBorrows: {
        amount: borrows,
        display: convertAmountToNativeDisplay(borrows, 'USD' as NativeCurrencyKey),
      },
      totalRewards: {
        amount: rewards,
        display: convertAmountToNativeDisplay(rewards, 'USD' as NativeCurrencyKey),
      },
      totalLocked: {
        amount: '0',
        display: convertAmountToNativeDisplay('0', 'USD' as NativeCurrencyKey),
      },
    },
    dapp: {
      name: 'Test',
      url: '',
      icon_url: '',
      colors: { primary: '#000', fallback: '#000', shadow: '#000' },
    },
  });

  it('should calculate grand totals from multiple positions', () => {
    const positions = [
      createMockPositionWithTotals('1000', '200', '50', '850'),
      createMockPositionWithTotals('2000', '300', '100', '1800'),
      createMockPositionWithTotals('500', '100', '25', '425'),
    ];

    const grandTotals = calculateGrandTotals(positions, 'USD');

    expect(grandTotals.totalDeposits.amount).toBe('3500');
    expect(grandTotals.totalBorrows.amount).toBe('600');
    expect(grandTotals.totalRewards.amount).toBe('175');
    expect(grandTotals.total.amount).toBe('3075');
  });

  it('should handle empty positions array', () => {
    const grandTotals = calculateGrandTotals([], 'USD');

    expect(grandTotals.totalDeposits.amount).toBe('0');
    expect(grandTotals.totalBorrows.amount).toBe('0');
    expect(grandTotals.totalRewards.amount).toBe('0');
    expect(grandTotals.total.amount).toBe('0');
  });

  it('should handle single position', () => {
    const positions = [createMockPositionWithTotals('1000', '200', '50', '850')];

    const grandTotals = calculateGrandTotals(positions, 'USD');

    expect(grandTotals.totalDeposits.amount).toBe('1000');
    expect(grandTotals.totalBorrows.amount).toBe('200');
    expect(grandTotals.totalRewards.amount).toBe('50');
    expect(grandTotals.total.amount).toBe('850');
  });

  it('should handle positions with zero values', () => {
    const positions = [
      createMockPositionWithTotals('1000', '0', '0', '1000'),
      createMockPositionWithTotals('0', '500', '0', '-500'),
      createMockPositionWithTotals('0', '0', '100', '100'),
    ];

    const grandTotals = calculateGrandTotals(positions, 'USD');

    expect(grandTotals.totalDeposits.amount).toBe('1000');
    expect(grandTotals.totalBorrows.amount).toBe('500');
    expect(grandTotals.totalRewards.amount).toBe('100');
    expect(grandTotals.total.amount).toBe('600');
  });

  it('should format with EUR currency', () => {
    const positions = [createMockPositionWithTotals('1000', '200', '50', '850')];

    const grandTotals = calculateGrandTotals(positions, 'EUR');

    expect(grandTotals.totalDeposits.amount).toBe('1000');
    expect(grandTotals.totalBorrows.amount).toBe('200');
    expect(grandTotals.totalRewards.amount).toBe('50');
    expect(grandTotals.total.amount).toBe('850');
    // Display format will vary based on locale, just check it exists
    expect(grandTotals.total.display).toBeDefined();
  });

  it('should handle decimal values', () => {
    const positions = [
      createMockPositionWithTotals('100.50', '25.25', '10.10', '85.35'),
      createMockPositionWithTotals('200.75', '50.50', '5.05', '155.30'),
    ];

    const grandTotals = calculateGrandTotals(positions, 'USD');

    expect(grandTotals.totalDeposits.amount).toBe('301.25');
    expect(grandTotals.totalBorrows.amount).toBe('75.75');
    expect(grandTotals.totalRewards.amount).toBe('15.15');
    expect(grandTotals.total.amount).toBe('240.65');
  });

  it('should handle negative totals', () => {
    const positions = [createMockPositionWithTotals('100', '500', '0', '-400'), createMockPositionWithTotals('200', '100', '0', '100')];

    const grandTotals = calculateGrandTotals(positions, 'USD');

    expect(grandTotals.totalDeposits.amount).toBe('300');
    expect(grandTotals.totalBorrows.amount).toBe('600');
    expect(grandTotals.totalRewards.amount).toBe('0');
    expect(grandTotals.total.amount).toBe('-300');
  });
});

describe('calculateTokenNativeDisplay', () => {
  const createMockToken = (amount: string, price?: number): PositionToken => ({
    amount,
    asset:
      price !== undefined
        ? ({
            chainId: 1,
            address: '0x123',
            symbol: 'TEST',
            name: 'Test Token',
            decimals: 18,
            iconUrl: '',
            price: {
              value: price,
              changedAt: new Date(),
              relativeChange24h: 0,
            },
          } as any)
        : undefined,
  });

  it('should calculate value correctly with price', () => {
    const token = createMockToken('100', 2.5);
    const result = calculateTokenNativeDisplay(token, 'USD');

    expect(result.amount).toBe('250');
    expect(result.display).toMatch(/\$250/);
  });

  it('should return zero for token without asset', () => {
    const token = createMockToken('100');
    const result = calculateTokenNativeDisplay(token, 'USD');

    expect(result.amount).toBe('0');
    expect(result.display).toBe('$0.00');
  });

  it('should return zero for token with asset but no price', () => {
    const token: PositionToken = {
      amount: '100',
      asset: {
        chainId: 1,
        address: '0x123',
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 18,
        iconUrl: '',
        price: undefined,
      } as any,
    };
    const result = calculateTokenNativeDisplay(token, 'USD');

    expect(result.amount).toBe('0');
    expect(result.display).toBe('$0.00');
  });

  it('should handle zero amount', () => {
    const token = createMockToken('0', 100);
    const result = calculateTokenNativeDisplay(token, 'USD');

    expect(result.amount).toBe('0');
    expect(result.display).toBe('$0.00');
  });

  it('should handle zero price', () => {
    const token = createMockToken('100', 0);
    const result = calculateTokenNativeDisplay(token, 'USD');

    expect(result.amount).toBe('0');
    expect(result.display).toBe('$0.00');
  });

  it('should handle decimal amounts and prices', () => {
    const token = createMockToken('1.5', 2.5);
    const result = calculateTokenNativeDisplay(token, 'USD');

    expect(result.amount).toBe('3.75');
    expect(result.display).toMatch(/\$3\.75/);
  });

  it('should handle very large values', () => {
    const token = createMockToken('1000000', 1000);
    const result = calculateTokenNativeDisplay(token, 'USD');

    expect(result.amount).toBe('1000000000');
    expect(result.display).toBeDefined();
  });

  it('should handle very small values', () => {
    const token = createMockToken('0.000001', 0.01);
    const result = calculateTokenNativeDisplay(token, 'USD');

    expect(result.amount).toBe('1e-8'); // JavaScript represents very small numbers in scientific notation
    expect(result.display).toBeDefined();
  });

  it('should handle missing amount', () => {
    const token = createMockToken('', 100);
    const result = calculateTokenNativeDisplay(token, 'USD');

    expect(result.amount).toBe('0');
    expect(result.display).toBe('$0.00');
  });

  it('should work with EUR currency', () => {
    const token = createMockToken('100', 2);
    const result = calculateTokenNativeDisplay(token, 'EUR');

    expect(result.amount).toBe('200');
    expect(result.display).toBeDefined();
    expect(typeof result.display).toBe('string');
  });
});
