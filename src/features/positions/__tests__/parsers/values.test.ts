/**
 * Tests for value calculation functions
 *
 * Ensures that token amounts in decimal format (from new API) are correctly
 * converted to native currency values for display.
 */

import { calculateTokenNativeDisplay, calculateTotalValue, processUnderlyingAssets } from '../../parsers/values';
import type { PositionToken } from '../../types';
import type { Asset } from '../../types/generated/common/asset';

// Use USD as test currency
const TEST_CURRENCY = 'usd';

// Helper to create a mock asset
function createMockAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 1,
    name: 'Test Token',
    symbol: 'TEST',
    decimals: 18,
    type: 'erc20',
    iconUrl: 'https://test.logo',
    network: 'ethereum',
    mainnetAddress: '0x0000000000000000000000000000000000000000',
    verified: true,
    transferable: true,
    creationDate: '2024-01-01T00:00:00Z',
    colors: {
      primary: '#000000',
      fallback: '#ffffff',
    },
    price: {
      value: 1,
      changedAt: undefined,
      relativeChange24h: 0,
    },
    networks: {},
    bridging: undefined,
    ...overrides,
  } as Asset;
}

// Mock logger
jest.mock('@/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock utilities to avoid native currency dependencies
jest.mock('@/helpers/utilities', () => ({
  ...jest.requireActual('@/helpers/utilities'),
  convertRawAmountToNativeDisplay: jest.fn((amount, decimals, price) => {
    const decimalAmount = parseFloat(amount) / Math.pow(10, decimals);
    const value = (decimalAmount * parseFloat(price)).toString();
    return {
      amount: value,
      display: `$${value}`,
    };
  }),
  convertAmountToNativeDisplay: jest.fn(amount => {
    const val = parseFloat(amount);
    if (val === 0) return '$0.00';
    if (val < 0.01) return `$${val.toFixed(4)}`;
    return `$${val.toFixed(2)}`;
  }),
}));

describe('Value Calculations', () => {
  describe('calculateTokenNativeDisplay', () => {
    it('should calculate USD value from decimal amount', () => {
      const token: PositionToken = {
        asset: createMockAsset({
          symbol: 'ETH',
          price: {
            value: 2000,
            changedAt: new Date(),
            relativeChange24h: 0,
          },
        }),
        amount: '10', // 10 ETH in decimal format
      };

      const result = calculateTokenNativeDisplay(token, TEST_CURRENCY);

      expect(result.amount).toBe('20000'); // 10 * 2000
      expect(result.display).toContain('20'); // Display format includes currency symbol
    });

    it('should handle fractional amounts', () => {
      const token: PositionToken = {
        asset: createMockAsset({
          symbol: 'WETH',
          price: {
            value: 2000,
            changedAt: new Date(),
            relativeChange24h: 0,
          },
        }),
        amount: '0.05', // 0.05 ETH
      };

      const result = calculateTokenNativeDisplay(token, TEST_CURRENCY);

      expect(result.amount).toBe('100'); // 0.05 * 2000
    });

    it('should handle USDC with 6 decimals', () => {
      const token: PositionToken = {
        asset: createMockAsset({
          symbol: 'USDC',
          decimals: 6,
          price: {
            value: 1,
            changedAt: new Date(),
            relativeChange24h: 0,
          },
        }),
        amount: '5000', // 5000 USDC in decimal format
      };

      const result = calculateTokenNativeDisplay(token, TEST_CURRENCY);

      expect(result.amount).toBe('5000'); // 5000 * 1
    });

    it('should handle zero amounts', () => {
      const token: PositionToken = {
        asset: createMockAsset({
          symbol: 'ETH',
          price: {
            value: 2000,
            changedAt: new Date(),
            relativeChange24h: 0,
          },
        }),
        amount: '0',
      };

      const result = calculateTokenNativeDisplay(token, TEST_CURRENCY);

      expect(result.amount).toBe('0');
    });

    it('should handle missing price', () => {
      const token: PositionToken = {
        asset: createMockAsset({
          symbol: 'UNKNOWN',
          price: undefined,
        }),
        amount: '100',
      };

      const result = calculateTokenNativeDisplay(token, TEST_CURRENCY);

      expect(result.amount).toBe('0'); // No price = 0 value
    });

    it('should handle missing asset', () => {
      const token: PositionToken = {
        asset: undefined,
        amount: '100',
      };

      const result = calculateTokenNativeDisplay(token, TEST_CURRENCY);

      expect(result.amount).toBe('0');
    });

    it('should handle large amounts correctly', () => {
      const token: PositionToken = {
        asset: createMockAsset({
          symbol: 'GRT',
          price: {
            value: 0.08,
            changedAt: new Date(),
            relativeChange24h: 0,
          },
        }),
        amount: '414.657', // Large token amount
      };

      const result = calculateTokenNativeDisplay(token, TEST_CURRENCY);

      const expected = 414.657 * 0.08;
      expect(parseFloat(result.amount)).toBeCloseTo(expected, 2);
    });

    it('should handle very small amounts', () => {
      const token: PositionToken = {
        asset: createMockAsset({
          symbol: 'WETH',
          price: {
            value: 2000,
            changedAt: new Date(),
            relativeChange24h: 0,
          },
        }),
        amount: '0.0025', // Very small amount
      };

      const result = calculateTokenNativeDisplay(token, TEST_CURRENCY);

      expect(result.amount).toBe('5'); // 0.0025 * 2000
    });
  });

  describe('processUnderlyingAssets', () => {
    it('should process multiple tokens', () => {
      const tokens: PositionToken[] = [
        {
          asset: createMockAsset({
            symbol: 'WETH',
            price: {
              value: 2000,
              changedAt: new Date(),
              relativeChange24h: 0,
            },
          }),
          amount: '0.05',
        },
        {
          asset: createMockAsset({
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: 6,
            price: {
              value: 1,
              changedAt: new Date(),
              relativeChange24h: 0,
            },
          }),
          amount: '50',
        },
      ];

      const result = processUnderlyingAssets(tokens, TEST_CURRENCY);

      expect(result).toHaveLength(2);
      expect(result[0].asset.symbol).toBe('WETH');
      expect(result[0].quantity).toBe('0.05');
      expect(result[0].native.amount).toBe('100'); // 0.05 * 2000

      expect(result[1].asset.symbol).toBe('USDC');
      expect(result[1].quantity).toBe('50');
      expect(result[1].native.amount).toBe('50'); // 50 * 1
    });

    it('should filter out null assets', () => {
      const tokens: PositionToken[] = [
        {
          asset: undefined,
          amount: '100',
        },
        {
          asset: createMockAsset({
            symbol: 'ETH',
            price: {
              value: 2000,
              changedAt: new Date(),
              relativeChange24h: 0,
            },
          }),
          amount: '1',
        },
      ];

      const result = processUnderlyingAssets(tokens, TEST_CURRENCY);

      expect(result).toHaveLength(1);
      expect(result[0].asset.symbol).toBe('ETH');
    });

    it('should handle empty token array', () => {
      const result = processUnderlyingAssets([], 'usd');

      expect(result).toHaveLength(0);
    });

    it('should handle undefined token array', () => {
      const result = processUnderlyingAssets(undefined, 'usd');

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateTotalValue', () => {
    it('should sum multiple underlying asset values', () => {
      const underlying = processUnderlyingAssets(
        [
          {
            asset: createMockAsset({
              symbol: 'WETH',
              price: {
                value: 2000,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
            }),
            amount: '0.05', // $100
          },
          {
            asset: createMockAsset({
              symbol: 'USDC',
              price: {
                value: 1,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
            }),
            amount: '50', // $50
          },
        ],
        TEST_CURRENCY
      );

      const total = calculateTotalValue(underlying);

      expect(total).toBe('150'); // 100 + 50
    });

    it('should handle single asset', () => {
      const underlying = processUnderlyingAssets(
        [
          {
            asset: createMockAsset({
              symbol: 'ETH',
              price: {
                value: 2000,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
            }),
            amount: '10',
          },
        ],
        TEST_CURRENCY
      );

      const total = calculateTotalValue(underlying);

      expect(total).toBe('20000');
    });

    it('should handle empty array', () => {
      const total = calculateTotalValue([]);

      expect(total).toBe('0');
    });

    it('should handle assets with zero value', () => {
      const underlying = processUnderlyingAssets(
        [
          {
            asset: createMockAsset({
              symbol: 'WETH',
              price: {
                value: 2000,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
            }),
            amount: '0', // Out of range position
          },
          {
            asset: createMockAsset({
              symbol: 'GRT',
              price: {
                value: 0.08,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
            }),
            amount: '414.657',
          },
        ],
        TEST_CURRENCY
      );

      const total = calculateTotalValue(underlying);

      const expected = 414.657 * 0.08;
      expect(parseFloat(total)).toBeCloseTo(expected, 2);
    });
  });

  describe('Real-world examples from ListPositions API', () => {
    it('should match Uniswap V3 GRT/WETH pool calculation', () => {
      // Based on actual fixture data: uniswap3:1
      const tokens: PositionToken[] = [
        {
          asset: createMockAsset({
            symbol: 'WETH',
            decimals: 18,
            price: {
              value: 4199.97,
              changedAt: new Date(),
              relativeChange24h: 0,
            },
          }),
          amount: '0', // Out of range
        },
        {
          asset: createMockAsset({
            symbol: 'GRT',
            decimals: 18,
            price: {
              value: 0.08080274846299905,
              changedAt: new Date(),
              relativeChange24h: 0,
            },
          }),
          amount: '414.65726486351554',
        },
      ];

      const underlying = processUnderlyingAssets(tokens, 'usd');
      const total = calculateTotalValue(underlying);

      // Expected: 414.657 * 0.0808 ≈ 33.51
      expect(parseFloat(total)).toBeCloseTo(33.51, 1);
    });

    it('should match Uniswap V2 MTA/WETH pool calculation', () => {
      // Based on actual fixture data: uniswap2:1
      const tokens: PositionToken[] = [
        {
          asset: createMockAsset({
            symbol: 'MTA',
            decimals: 18,
            price: {
              value: 0.03182107248895654,
              changedAt: new Date(),
              relativeChange24h: 0,
            },
          }),
          amount: '6.881625042890833',
        },
        {
          asset: createMockAsset({
            symbol: 'WETH',
            decimals: 18,
            price: {
              value: 4199.97,
              changedAt: new Date(),
              relativeChange24h: 0,
            },
          }),
          amount: '0.00005213304606007204',
        },
      ];

      const underlying = processUnderlyingAssets(tokens, 'usd');
      const total = calculateTotalValue(underlying);

      // Expected: (6.88 * 0.032) + (0.000052 * 4200) ≈ 0.44
      expect(parseFloat(total)).toBeCloseTo(0.44, 2);
    });
  });
});
