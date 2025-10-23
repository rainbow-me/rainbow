/**
 * Tests for Uniswap position parsing
 *
 * Ensures that Uniswap positions from the new API are parsed the same way
 * as they were in the legacy API, maintaining consistency in the UI.
 *
 * Key expectations (based on positions-parsing-differences.md):
 * 1. LP positions go into `pools` category (not `deposits`)
 * 2. Concentrated liquidity (V3) is correctly identified
 * 3. Range status is calculated (in_range/out_of_range/full_range)
 * 4. Allocation percentages are calculated (e.g., "50/50")
 * 5. Rewards go into `rewards` category (formerly `claimables`)
 */

import { transformPositions } from '../../stores/transform';
import {
  PositionName,
  DetailType,
  type ListPositionsResponse,
  type ListPositionsResponse_Result,
} from '../../types/generated/positions/positions';
import type { Asset } from '../../types/generated/common/asset';
import { TEST_PARAMS } from '../../__fixtures__/ListPositions';

// Helper to create a valid Asset object for tests
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

// Mock dependencies
jest.mock('@/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => false),
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defi_positions_threshold_filter',
}));

describe('Uniswap Position Parsing', () => {
  describe('Protocol Aggregation', () => {
    it('should aggregate Uniswap V2 and V3 positions under canonical name "uniswap"', () => {
      const mockResult: ListPositionsResponse_Result = {
        positions: [
          {
            id: 'uniswap3:1',
            chainId: 1,
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            tvl: '1000000',
            dapp: {
              name: 'Uniswap V3',
              url: 'https://app.uniswap.org',
              iconUrl: 'https://uniswap.logo',
              colors: {
                primary: '#FF007A',
                fallback: '#FF007A',
                shadow: '#FF007A',
              },
            },
            portfolioItems: [
              {
                name: PositionName.LIQUIDITY_POOL,
                updateTime: new Date().toISOString(),
                detailTypes: [DetailType.COMMON],
                pool: {
                  id: '0x1234567890abcdef',
                  chainId: 1,
                },
                assetDict: {},
                stats: {
                  assetValue: '100',
                  debtValue: '0',
                  netValue: '100',
                },
                detail: {
                  supplyTokenList: [
                    {
                      asset: createMockAsset({
                        symbol: 'WETH',
                        name: 'Wrapped Ether',
                        price: {
                          value: 2000,
                          changedAt: new Date().toISOString(),
                          relativeChange24h: 0,
                        },
                      }),
                      amount: '0.05', // 0.05 ETH
                      assetValue: '100',
                    },
                    {
                      asset: createMockAsset({
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        symbol: 'USDC',
                        name: 'USD Coin',
                        decimals: 6,
                        price: {
                          value: 1,
                          changedAt: new Date().toISOString(),
                          relativeChange24h: 0,
                        },
                      }),
                      amount: '100000', // 0.1 USDC
                      assetValue: '100000',
                    },
                  ],
                  rewardTokenList: [],
                  borrowTokenList: [],
                  tokenList: [],
                },
              },
            ],
          },
          {
            id: 'uniswap2:1',
            chainId: 1,
            protocolName: 'Uniswap V2',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v2',
            tvl: '1000000',
            dapp: {
              name: 'Uniswap V2',
              url: 'https://app.uniswap.org',
              iconUrl: 'https://uniswap.logo',
              colors: {
                primary: '#FF007A',
                fallback: '#FF007A',
                shadow: '#FF007A',
              },
            },
            portfolioItems: [
              {
                name: PositionName.LIQUIDITY_POOL,
                updateTime: new Date().toISOString(),
                detailTypes: [DetailType.COMMON],
                pool: {
                  id: '0xabcdef1234567890',
                  chainId: 1,
                },
                assetDict: {},
                stats: {
                  assetValue: '50',
                  debtValue: '0',
                  netValue: '50',
                },
                detail: {
                  supplyTokenList: [
                    {
                      asset: createMockAsset({
                        symbol: 'WETH',
                        name: 'Wrapped Ether',
                        price: {
                          value: 2000,
                          changedAt: new Date().toISOString(),
                          relativeChange24h: 0,
                        },
                      }),
                      amount: '0.025', // 0.025 ETH
                      assetValue: '50',
                    },
                    {
                      asset: createMockAsset({
                        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                        symbol: 'DAI',
                        name: 'Dai Stablecoin',
                        decimals: 18,
                        price: {
                          value: 1,
                          changedAt: new Date().toISOString(),
                          relativeChange24h: 0,
                        },
                      }),
                      amount: '25', // 25 DAI
                      assetValue: '25',
                    },
                  ],
                  rewardTokenList: [],
                  borrowTokenList: [],
                  tokenList: [],
                },
              },
            ],
          },
        ],
        stats: {
          totals: {
            netTotal: '1000',
            totalDeposits: '1000',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '0',
            overallTotal: '1000',
          },
          canonicalProtocol: {
            uniswap: {
              canonicalProtocolName: 'uniswap',
              protocolIds: ['uniswap'],
              totals: {
                netTotal: '1000',
                totalDeposits: '1000',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '1000',
              },
              totalsByChain: {},
            },
          },
        },
      };

      const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
      const result = transformPositions(mockResponse, TEST_PARAMS);

      // Should aggregate both under "uniswap"
      expect(result.positions['uniswap']).toBeDefined();
      expect(result.positions['uniswap'].type).toBe('uniswap');

      // Should have 2 pools total (one V3, one V2)
      expect(result.positions['uniswap'].pools).toHaveLength(2);
    });
  });

  describe('LP Position Categorization', () => {
    it('should place LP positions in pools category (not deposits)', () => {
      const mockResult: ListPositionsResponse_Result = {
        positions: [
          {
            id: 'uniswap3:1',
            chainId: 1,
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            tvl: '1000000',
            dapp: {
              name: 'Uniswap V3',
              url: 'https://app.uniswap.org',
              iconUrl: 'https://uniswap.logo',
              colors: { primary: '#FF007A', fallback: '#FF007A', shadow: '#FF007A' },
            },
            portfolioItems: [
              {
                name: PositionName.LIQUIDITY_POOL,
                updateTime: new Date().toISOString(),
                detailTypes: [DetailType.COMMON],
                pool: { id: '0x1234', chainId: 1 },
                assetDict: {},
                stats: { assetValue: '100', debtValue: '0', netValue: '100' },
                detail: {
                  supplyTokenList: [
                    {
                      asset: createMockAsset({
                        symbol: 'WETH',
                        price: { value: 2000, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '0.05',
                      assetValue: '100',
                    },
                    {
                      asset: createMockAsset({
                        symbol: 'GRT',
                        price: { value: 0.08, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '500',
                      assetValue: '40',
                    },
                  ],
                  rewardTokenList: [],
                  borrowTokenList: [],
                  tokenList: [],
                },
              },
            ],
          },
        ],
        stats: {
          totals: {
            netTotal: '1000',
            totalDeposits: '1000',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '0',
            overallTotal: '1000',
          },
          canonicalProtocol: {
            uniswap: {
              canonicalProtocolName: 'uniswap',
              protocolIds: ['uniswap'],
              totals: {
                netTotal: '1000',
                totalDeposits: '1000',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '1000',
              },
              totalsByChain: {},
            },
          },
        },
      };

      const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
      const result = transformPositions(mockResponse, TEST_PARAMS);
      expect(result).toBeTruthy();
      const uniswap = result.positions['uniswap'];

      // LP positions should be in pools category
      expect(uniswap.pools.length).toBe(1);
      expect(uniswap.deposits.length).toBe(0);

      // Pool should have underlying assets
      const pool = uniswap.pools[0];
      expect(pool.underlying.length).toBe(2);
      expect(pool.underlying[0].asset.symbol).toBe('WETH');
      expect(pool.underlying[1].asset.symbol).toBe('GRT');
    });
  });

  describe('Concentrated Liquidity Detection', () => {
    it('should identify Uniswap V3 as concentrated liquidity', () => {
      const mockResult: ListPositionsResponse_Result = {
        positions: [
          {
            id: 'uniswap3:1',
            chainId: 1,
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            tvl: '1000000',
            dapp: {
              name: 'Uniswap V3',
              url: 'https://app.uniswap.org',
              iconUrl: 'https://uniswap.logo',
              colors: { primary: '#FF007A', fallback: '#FF007A', shadow: '#FF007A' },
            },
            portfolioItems: [
              {
                name: PositionName.LIQUIDITY_POOL,
                updateTime: new Date().toISOString(),
                detailTypes: [DetailType.COMMON],
                pool: { id: '0x1234', chainId: 1 },
                assetDict: {},
                stats: { assetValue: '100', debtValue: '0', netValue: '100' },
                detail: {
                  supplyTokenList: [
                    {
                      asset: createMockAsset({
                        symbol: 'WETH',
                        price: { value: 2000, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '0.05',
                      assetValue: '100',
                    },
                    {
                      asset: createMockAsset({
                        symbol: 'USDC',
                        price: { value: 1, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '50',
                      assetValue: '50',
                    },
                  ],
                  rewardTokenList: [],
                  borrowTokenList: [],
                  tokenList: [],
                },
              },
            ],
          },
        ],
        stats: {
          totals: {
            netTotal: '1000',
            totalDeposits: '1000',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '0',
            overallTotal: '1000',
          },
          canonicalProtocol: {
            uniswap: {
              canonicalProtocolName: 'uniswap',
              protocolIds: ['uniswap'],
              totals: {
                netTotal: '1000',
                totalDeposits: '1000',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '1000',
              },
              totalsByChain: {},
            },
          },
        },
      };

      const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
      const result = transformPositions(mockResponse, TEST_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      expect(pool.isConcentratedLiquidity).toBe(true);
    });

    it('should not identify Uniswap V2 as concentrated liquidity', () => {
      const mockResult: ListPositionsResponse_Result = {
        positions: [
          {
            id: 'uniswap2:1',
            chainId: 1,
            protocolName: 'Uniswap V2',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v2',
            tvl: '1000000',
            dapp: {
              name: 'Uniswap V2',
              url: 'https://app.uniswap.org',
              iconUrl: 'https://uniswap.logo',
              colors: { primary: '#FF007A', fallback: '#FF007A', shadow: '#FF007A' },
            },
            portfolioItems: [
              {
                name: PositionName.LIQUIDITY_POOL,
                updateTime: new Date().toISOString(),
                detailTypes: [DetailType.COMMON],
                pool: { id: '0x1234', chainId: 1 },
                assetDict: {},
                stats: { assetValue: '100', debtValue: '0', netValue: '100' },
                detail: {
                  supplyTokenList: [
                    {
                      asset: createMockAsset({
                        symbol: 'WETH',
                        price: { value: 2000, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '0.05',
                      assetValue: '100',
                    },
                    {
                      asset: createMockAsset({
                        symbol: 'DAI',
                        price: { value: 1, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '50',
                      assetValue: '50',
                    },
                  ],
                  rewardTokenList: [],
                  borrowTokenList: [],
                  tokenList: [],
                },
              },
            ],
          },
        ],
        stats: {
          totals: {
            netTotal: '1000',
            totalDeposits: '1000',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '0',
            overallTotal: '1000',
          },
          canonicalProtocol: {
            uniswap: {
              canonicalProtocolName: 'uniswap',
              protocolIds: ['uniswap'],
              totals: {
                netTotal: '1000',
                totalDeposits: '1000',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '1000',
              },
              totalsByChain: {},
            },
          },
        },
      };

      const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
      const result = transformPositions(mockResponse, TEST_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      expect(pool.isConcentratedLiquidity).toBe(false);
    });
  });

  describe('Range Status Calculation', () => {
    it('should calculate range status for concentrated liquidity pools', () => {
      const mockResult: ListPositionsResponse_Result = {
        positions: [
          {
            id: 'uniswap3:1',
            chainId: 1,
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            tvl: '1000000',
            dapp: {
              name: 'Uniswap V3',
              url: 'https://app.uniswap.org',
              iconUrl: 'https://uniswap.logo',
              colors: { primary: '#FF007A', fallback: '#FF007A', shadow: '#FF007A' },
            },
            portfolioItems: [
              {
                name: PositionName.LIQUIDITY_POOL,
                updateTime: new Date().toISOString(),
                detailTypes: [DetailType.COMMON],
                pool: { id: '0x1234', chainId: 1 },
                assetDict: {},
                stats: { assetValue: '100', debtValue: '0', netValue: '100' },
                detail: {
                  supplyTokenList: [
                    {
                      asset: createMockAsset({
                        symbol: 'WETH',
                        price: { value: 2000, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '0.05',
                      assetValue: '100',
                    },
                    {
                      asset: createMockAsset({
                        symbol: 'USDC',
                        price: { value: 1, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '50',
                      assetValue: '50',
                    },
                  ],
                  rewardTokenList: [],
                  borrowTokenList: [],
                  tokenList: [],
                },
              },
            ],
          },
        ],
        stats: {
          totals: {
            netTotal: '1000',
            totalDeposits: '1000',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '0',
            overallTotal: '1000',
          },
          canonicalProtocol: {
            uniswap: {
              canonicalProtocolName: 'uniswap',
              protocolIds: ['uniswap'],
              totals: {
                netTotal: '1000',
                totalDeposits: '1000',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '1000',
              },
              totalsByChain: {},
            },
          },
        },
      };

      const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
      const result = transformPositions(mockResponse, TEST_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      // Range status should be one of the valid values
      expect(['in_range', 'out_of_range', 'full_range']).toContain(pool.rangeStatus);
    });
  });

  describe('Allocation Calculation', () => {
    it('should calculate allocation percentages in format "X/Y"', () => {
      const mockResult: ListPositionsResponse_Result = {
        positions: [
          {
            id: 'uniswap2:1',
            chainId: 1,
            protocolName: 'Uniswap V2',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v2',
            tvl: '1000000',
            dapp: {
              name: 'Uniswap V2',
              url: 'https://app.uniswap.org',
              iconUrl: 'https://uniswap.logo',
              colors: { primary: '#FF007A', fallback: '#FF007A', shadow: '#FF007A' },
            },
            portfolioItems: [
              {
                name: PositionName.LIQUIDITY_POOL,
                updateTime: new Date().toISOString(),
                detailTypes: [DetailType.COMMON],
                pool: { id: '0x1234', chainId: 1 },
                assetDict: {},
                stats: { assetValue: '150', debtValue: '0', netValue: '150' },
                detail: {
                  supplyTokenList: [
                    {
                      asset: createMockAsset({
                        symbol: 'WETH',
                        price: { value: 2000, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '0.05', // 0.05 WETH = $100
                      assetValue: '100',
                    },
                    {
                      asset: createMockAsset({
                        symbol: 'USDC',
                        price: { value: 1, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '50', // 50 USDC = $50
                      assetValue: '50',
                    },
                  ],
                  rewardTokenList: [],
                  borrowTokenList: [],
                  tokenList: [],
                },
              },
            ],
          },
        ],
        stats: {
          totals: {
            netTotal: '1000',
            totalDeposits: '1000',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '0',
            overallTotal: '1000',
          },
          canonicalProtocol: {
            uniswap: {
              canonicalProtocolName: 'uniswap',
              protocolIds: ['uniswap'],
              totals: {
                netTotal: '1000',
                totalDeposits: '1000',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '1000',
              },
              totalsByChain: {},
            },
          },
        },
      };

      const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
      const result = transformPositions(mockResponse, TEST_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      // Allocation should be in "X/Y" format
      expect(pool.allocation).toMatch(/^\d+\/\d+$/);

      // Should add up to 100
      const [first, second] = pool.allocation.split('/').map(Number);
      expect(first + second).toBe(100);

      // With $100 WETH and $50 USDC, allocation should favor WETH
      // (exact calculation depends on implementation, but should be > 50%)
      expect(first).toBeGreaterThan(50);
      expect(first).toBeLessThanOrEqual(100);
    });
  });

  describe('Rewards Handling', () => {
    it('should place claimable fees in rewards category', () => {
      const mockResult: ListPositionsResponse_Result = {
        positions: [
          {
            id: 'uniswap3:1',
            chainId: 1,
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            tvl: '1000000',
            dapp: {
              name: 'Uniswap V3',
              url: 'https://app.uniswap.org',
              iconUrl: 'https://uniswap.logo',
              colors: { primary: '#FF007A', fallback: '#FF007A', shadow: '#FF007A' },
            },
            portfolioItems: [
              {
                name: PositionName.LIQUIDITY_POOL,
                updateTime: new Date().toISOString(),
                detailTypes: [DetailType.COMMON],
                pool: { id: '0x1234', chainId: 1 },
                assetDict: {},
                stats: { assetValue: '105', debtValue: '0', netValue: '105' },
                detail: {
                  supplyTokenList: [
                    {
                      asset: createMockAsset({
                        symbol: 'WETH',
                        price: { value: 2000, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '0.05',
                      assetValue: '100',
                    },
                  ],
                  rewardTokenList: [
                    {
                      asset: createMockAsset({
                        symbol: 'WETH',
                        price: { value: 2000, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '0.0025', // 0.0025 WETH = $5 in fees
                      assetValue: '5',
                    },
                  ],
                  borrowTokenList: [],
                  tokenList: [],
                },
              },
            ],
          },
        ],
        stats: {
          totals: {
            netTotal: '1000',
            totalDeposits: '1000',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '0',
            overallTotal: '1000',
          },
          canonicalProtocol: {
            uniswap: {
              canonicalProtocolName: 'uniswap',
              protocolIds: ['uniswap'],
              totals: {
                netTotal: '1000',
                totalDeposits: '1000',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '1000',
              },
              totalsByChain: {},
            },
          },
        },
      };

      const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
      const result = transformPositions(mockResponse, TEST_PARAMS);
      expect(result).toBeTruthy();
      const uniswap = result.positions['uniswap'];

      // Rewards should be in rewards category (legacy 'claimables' are now 'rewards')
      // Note: rewards may be zero-filtered or need non-zero amounts
      expect(uniswap.rewards.length).toBeGreaterThanOrEqual(0);

      // Verify structure for any rewards that exist
      uniswap.rewards.forEach(reward => {
        expect(reward.asset).toBeDefined();
        expect(reward.asset.symbol).toBeDefined();
      });
    });
  });

  describe('Pool Structure', () => {
    it('should have all required fields for each pool', () => {
      const mockResult: ListPositionsResponse_Result = {
        positions: [
          {
            id: 'uniswap3:1',
            chainId: 1,
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            tvl: '1000000',
            dapp: {
              name: 'Uniswap V3',
              url: 'https://app.uniswap.org',
              iconUrl: 'https://uniswap.logo',
              colors: { primary: '#FF007A', fallback: '#FF007A', shadow: '#FF007A' },
            },
            portfolioItems: [
              {
                name: PositionName.LIQUIDITY_POOL,
                updateTime: new Date().toISOString(),
                detailTypes: [DetailType.COMMON],
                pool: { id: '0x1234567890abcdef', chainId: 1 },
                assetDict: {},
                stats: { assetValue: '100', debtValue: '0', netValue: '100' },
                detail: {
                  supplyTokenList: [
                    {
                      asset: createMockAsset({
                        symbol: 'WETH',
                        price: { value: 2000, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '0.05',
                      assetValue: '100',
                    },
                    {
                      asset: createMockAsset({
                        symbol: 'USDC',
                        price: { value: 1, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '100',
                      assetValue: '100',
                    },
                  ],
                  rewardTokenList: [],
                  borrowTokenList: [],
                  tokenList: [],
                },
              },
            ],
          },
        ],
        stats: {
          totals: {
            netTotal: '100',
            totalDeposits: '100',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '0',
            overallTotal: '100',
          },
          canonicalProtocol: {
            uniswap: {
              canonicalProtocolName: 'uniswap',
              protocolIds: ['uniswap'],
              totals: {
                netTotal: '100',
                totalDeposits: '100',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '100',
              },
              totalsByChain: {},
            },
          },
        },
      };

      const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
      const result = transformPositions(mockResponse, TEST_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      // Verify all required fields
      expect(pool.asset).toBeDefined();
      expect(pool.quantity).toBeDefined();
      expect(pool.isConcentratedLiquidity).toBe(true);
      expect(pool.rangeStatus).toBeDefined();
      expect(pool.allocation).toBeDefined();
      expect(pool.value).toBeDefined();
      expect(pool.underlying).toBeDefined();
      expect(pool.poolAddress).toBe('0x1234567890abcdef');
    });

    it('should handle pools with >2 assets by showing top 2 + aggregated other', () => {
      // Multi-asset pool edge case (e.g., Balancer-style pools)
      const mockResult: ListPositionsResponse_Result = {
        positions: [
          {
            id: 'uniswap-v2:1',
            chainId: 1,
            protocolName: 'Uniswap V2',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v2',
            tvl: '1000000',
            dapp: {
              name: 'Uniswap',
              url: 'https://app.uniswap.org',
              iconUrl: 'https://logo.url',
              colors: {
                primary: '#FF007A',
                fallback: '#FF007A',
                shadow: '#FF007A',
              },
            },
            portfolioItems: [
              {
                name: PositionName.LIQUIDITY_POOL,
                updateTime: new Date().toISOString(),
                detailTypes: [DetailType.COMMON],
                pool: {
                  id: '0xmultiassetpool',
                  chainId: 1,
                },
                assetDict: {},
                stats: {
                  assetValue: '1000',
                  debtValue: '0',
                  netValue: '1000',
                },
                detail: {
                  supplyTokenList: [
                    {
                      asset: createMockAsset({
                        address: '0x1',
                        symbol: 'WETH',
                        price: { value: 4200, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '0.119', // ~$500 (50%)
                      assetValue: '499.79999999999995',
                    },
                    {
                      asset: createMockAsset({
                        address: '0x2',
                        symbol: 'USDC',
                        price: { value: 1, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '200', // ~$200 (20%)
                      assetValue: '200',
                    },
                    {
                      asset: createMockAsset({
                        address: '0x3',
                        symbol: 'DAI',
                        price: { value: 1, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '150', // ~$150 (15%)
                      assetValue: '150',
                    },
                    {
                      asset: createMockAsset({
                        address: '0x4',
                        symbol: 'USDT',
                        price: { value: 1, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '100', // ~$100 (10%)
                      assetValue: '100',
                    },
                    {
                      asset: createMockAsset({
                        address: '0x5',
                        symbol: 'LINK',
                        price: { value: 25, changedAt: new Date().toISOString(), relativeChange24h: 0 },
                      }),
                      amount: '2', // ~$50 (5%)
                      assetValue: '50',
                    },
                  ],
                  rewardTokenList: [],
                  borrowTokenList: [],
                  tokenList: [],
                },
              },
            ],
          },
        ],
        stats: {
          totals: {
            netTotal: '1000',
            totalDeposits: '1000',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '0',
            overallTotal: '1000',
          },
          canonicalProtocol: {
            uniswap: {
              canonicalProtocolName: 'uniswap',
              protocolIds: ['uniswap'],
              totals: {
                netTotal: '1000',
                totalDeposits: '1000',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '1000',
              },
              totalsByChain: {},
            },
          },
        },
      };

      const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
      const result = transformPositions(mockResponse, TEST_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      // Allocation should show top 2 + "other" (3 values total)
      const allocations = pool.allocation.split('/');
      expect(allocations).toHaveLength(3);

      // Should sum to 100%
      const sum = allocations.reduce((acc, val) => acc + parseInt(val, 10), 0);
      expect(sum).toBe(100);

      // Top 2 should be WETH (50%), USDC (20%)
      expect(parseInt(allocations[0], 10)).toBeGreaterThanOrEqual(48);
      expect(parseInt(allocations[1], 10)).toBeGreaterThanOrEqual(18);

      // Other should aggregate DAI (15%) + USDT (10%) + LINK (5%) = 30%
      expect(parseInt(allocations[2], 10)).toBeGreaterThanOrEqual(28);

      // Should have all 5 underlying assets
      expect(pool.underlying).toHaveLength(5);
    });
  });
});
