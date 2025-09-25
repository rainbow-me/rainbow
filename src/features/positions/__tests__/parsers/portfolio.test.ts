/**
 * Tests for portfolio.ts parser
 * References debank-positions-tdd.md for processing logic
 */

import { processPositions } from '../../parsers/portfolio';
import { PositionName, type ListPositionsResponse_Result } from '../../types';
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

describe('Portfolio Parser', () => {
  // Test: Process positions from multiple protocols and chains (TDD Section 4.5.2)
  it('should aggregate positions by canonical protocol name across chains', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'uniswap-v3:1',
          chainId: 1,
          protocolName: 'Uniswap V3',
          canonicalProtocolName: 'uniswap',
          protocolVersion: 'v3',
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
              updateTime: new Date(),
              detailTypes: [],
              pool: undefined,
              assetDict: {},
              stats: {
                assetValue: '2000',
                debtValue: '0',
                netValue: '2000',
              },
              detail: {
                supplyTokenList: [
                  {
                    asset: createMockAsset({
                      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                      symbol: 'ETH',
                      name: 'Ethereum',
                      iconUrl: 'https://eth.logo',
                      price: {
                        value: 2000,
                        changedAt: new Date(),
                        relativeChange24h: 0,
                      },
                      decimals: 18,
                    }),
                    amount: '1', // 1 ETH (decimal format)
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
          id: 'uniswap-v2:137',
          chainId: 137,
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
              updateTime: new Date(),
              detailTypes: [],
              pool: undefined,
              assetDict: {},
              stats: {
                assetValue: '2000',
                debtValue: '0',
                netValue: '2000',
              },
              detail: {
                supplyTokenList: [
                  {
                    asset: createMockAsset({
                      address: '0x0000000000000000000000000000000000001010',
                      symbol: 'MATIC',
                      name: 'Polygon',
                      iconUrl: 'https://matic.logo',
                      price: {
                        value: 1,
                        changedAt: new Date(),
                        relativeChange24h: 0,
                      },
                      decimals: 18,
                    }),
                    amount: '1000', // 1000 MATIC
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
      uniqueTokens: ['eth', 'matic'],
    };

    const result = processPositions(mockResult, TEST_PARAMS.currency);

    // Should aggregate both Uniswap positions under single 'uniswap' key
    expect(Object.keys(result.positions)).toEqual(['uniswap']);
    expect(result.positions.uniswap.type).toBe('uniswap');
    expect(result.positions.uniswap.pools).toHaveLength(2);

    // Should track all chains where positions exist
    expect(result.positions.uniswap.chainIds).toEqual([1, 137]);

    // Should sum totals across both positions (2000 + 2000 = 4000)
    expect(result.positions.uniswap.totals.totals.amount).toBe('4000');
  });

  // Test: Position value filtering (TDD Section 4.5.3 - $1 threshold)
  it('should filter out positions below $1 value threshold', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'aave:1',
          chainId: 1,
          protocolName: 'Aave V3',
          canonicalProtocolName: 'aave-v3',
          protocolVersion: 'v3',
          tvl: '1000000',
          dapp: {
            name: 'Aave',
            url: 'https://app.aave.com',
            iconUrl: 'https://logo.url',
            colors: {
              primary: '#B6509E',
              fallback: '#B6509E',
              shadow: '#B6509E',
            },
          },
          portfolioItems: [
            {
              name: PositionName.LENDING,
              updateTime: new Date(),
              detailTypes: [],
              pool: undefined,
              assetDict: {},
              stats: {
                assetValue: '0.5',
                debtValue: '0',
                netValue: '0.5',
              },
              detail: {
                supplyTokenList: [
                  {
                    asset: createMockAsset({
                      address: '0x0000000000000000000000000000000000000001',
                      symbol: 'DUST',
                      name: 'Dust Token',
                      iconUrl: 'https://dust.logo',
                      price: {
                        value: 0.0001,
                        changedAt: new Date(),
                        relativeChange24h: 0,
                      },
                      decimals: 18,
                    }),
                    amount: '5000', // 5000 DUST worth $0.50
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
          id: 'compound:1',
          chainId: 1,
          protocolName: 'Compound V3',
          canonicalProtocolName: 'compound-v3',
          protocolVersion: 'v3',
          tvl: '1000000',
          dapp: {
            name: 'Compound',
            url: 'https://app.compound.finance',
            iconUrl: 'https://logo.url',
            colors: {
              primary: '#00D395',
              fallback: '#00D395',
              shadow: '#00D395',
            },
          },
          portfolioItems: [
            {
              name: PositionName.LENDING,
              updateTime: new Date(),
              detailTypes: [],
              pool: undefined,
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
                      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                      symbol: 'USDC',
                      name: 'USD Coin',
                      iconUrl: 'https://usdc.logo',
                      price: {
                        value: 1,
                        changedAt: new Date(),
                        relativeChange24h: 0,
                      },
                      decimals: 6,
                    }),
                    amount: '1000', // 1000 USDC with 6 decimals
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
      uniqueTokens: ['dust', 'usdc'],
    };

    const result = processPositions(mockResult, TEST_PARAMS.currency);

    // Should only include Compound position (>$1)
    expect(Object.keys(result.positions)).toEqual(['compound-v3']);
    expect(result.positions['aave-v3']).toBeUndefined();
  });

  // Test: Protocol filtering (TDD Section 4.5.3 - Hyperliquid exclusion)
  it('should filter out Hyperliquid perpetual positions', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'hyperliquid:1',
          chainId: 1,
          protocolName: 'Hyperliquid',
          canonicalProtocolName: 'hyperliquid',
          protocolVersion: '',
          tvl: '1000000',
          dapp: {
            name: 'Hyperliquid',
            url: 'https://app.hyperliquid.xyz',
            iconUrl: 'https://logo.url',
            colors: {
              primary: '#000000',
              fallback: '#000000',
              shadow: '#000000',
            },
          },
          portfolioItems: [
            {
              name: PositionName.PERPETUALS,
              updateTime: new Date(),
              detailTypes: [],
              pool: undefined,
              assetDict: {},
              stats: {
                assetValue: '10000',
                debtValue: '0',
                netValue: '10000',
              },
              detail: {
                supplyTokenList: [],
                rewardTokenList: [],
                borrowTokenList: [],
                tokenList: [],
              },
            },
          ],
        },
        {
          id: 'gmx:42161',
          chainId: 42161,
          protocolName: 'GMX',
          canonicalProtocolName: 'gmx',
          protocolVersion: '',
          tvl: '1000000',
          dapp: {
            name: 'GMX',
            url: 'https://app.gmx.io',
            iconUrl: 'https://logo.url',
            colors: {
              primary: '#2E3DEC',
              fallback: '#2E3DEC',
              shadow: '#2E3DEC',
            },
          },
          portfolioItems: [
            {
              name: PositionName.STAKED,
              updateTime: new Date(),
              detailTypes: [],
              pool: undefined,
              assetDict: {},
              stats: {
                assetValue: '5000',
                debtValue: '0',
                netValue: '5000',
              },
              detail: {
                supplyTokenList: [
                  {
                    asset: createMockAsset({
                      address: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a',
                      symbol: 'GMX',
                      name: 'GMX',
                      iconUrl: 'https://gmx.logo',
                      price: {
                        value: 50,
                        changedAt: new Date(),
                        relativeChange24h: 0,
                      },
                      decimals: 18,
                    }),
                    amount: '100', // 100 tokens
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
      uniqueTokens: ['gmx'],
    };

    const result = processPositions(mockResult, TEST_PARAMS.currency);

    // Should filter out Hyperliquid, keep GMX
    expect(Object.keys(result.positions)).toEqual(['gmx']);
    expect(result.positions['hyperliquid']).toBeUndefined();
  });

  // Test: Position sorting (TDD Section 4.4.2 - Sort by value)
  it('should sort protocols and items by value (highest first)', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'small:1',
          chainId: 1,
          protocolName: 'Small Protocol',
          canonicalProtocolName: 'small',
          protocolVersion: '',
          tvl: '1000000',
          dapp: {
            name: 'Small Protocol',
            url: 'https://small.fi',
            iconUrl: 'https://logo.url',
            colors: {
              primary: '#666666',
              fallback: '#666666',
              shadow: '#666666',
            },
          },
          portfolioItems: [
            {
              name: PositionName.DEPOSIT,
              updateTime: new Date(),
              detailTypes: [],
              pool: undefined,
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
                      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                      symbol: 'DAI',
                      name: 'DAI',
                      iconUrl: 'https://dai.logo',
                      price: {
                        value: 1,
                        changedAt: new Date(),
                        relativeChange24h: 0,
                      },
                      decimals: 18,
                    }),
                    amount: '100', // 100 tokens
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
          id: 'large:1',
          chainId: 1,
          protocolName: 'Large Protocol',
          canonicalProtocolName: 'large',
          protocolVersion: '',
          tvl: '1000000',
          dapp: {
            name: 'Large Protocol',
            url: 'https://large.fi',
            iconUrl: 'https://logo.url',
            colors: {
              primary: '#999999',
              fallback: '#999999',
              shadow: '#999999',
            },
          },
          portfolioItems: [
            {
              name: PositionName.DEPOSIT,
              updateTime: new Date(),
              detailTypes: [],
              pool: undefined,
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
                      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                      symbol: 'ETH',
                      name: 'Ethereum',
                      iconUrl: 'https://eth.logo',
                      price: {
                        value: 2000,
                        changedAt: new Date(),
                        relativeChange24h: 0,
                      },
                      decimals: 18,
                    }),
                    amount: '10', // 10 ETH in wei
                  },
                ],
                rewardTokenList: [],
                borrowTokenList: [],
                tokenList: [],
              },
            },
            {
              name: PositionName.DEPOSIT,
              updateTime: new Date(),
              detailTypes: [],
              pool: undefined,
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
                      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                      symbol: 'USDC',
                      name: 'USD Coin',
                      iconUrl: 'https://usdc.logo',
                      price: {
                        value: 1,
                        changedAt: new Date(),
                        relativeChange24h: 0,
                      },
                      decimals: 6,
                    }),
                    amount: '5000', // 5000 USDC (decimal format)
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
      uniqueTokens: ['dai', 'eth', 'usdc'],
    };

    const result = processPositions(mockResult, TEST_PARAMS.currency);

    // Protocols should be sorted by total value (large first)
    const protocolKeys = Object.keys(result.positions);
    expect(protocolKeys).toEqual(['large', 'small']);

    // Items within large protocol should be sorted by value
    const largeDeposits = result.positions.large.deposits;
    expect(largeDeposits[0].totalValue).toBe('20000'); // ETH position
    expect(largeDeposits[1].totalValue).toBe('5000'); // USDC position
  });

  // Test: Empty positions handling
  it('should return empty positions object when no positions provided', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [],
      uniqueTokens: [],
    };

    const result = processPositions(mockResult, TEST_PARAMS.currency);

    expect(result.positions).toEqual({});
    expect(result.totals.totals.amount).toBe('0');
    expect(result.positionTokens).toEqual([]);
  });

  // Test: Position tokens tracking (TDD Section 4.5.2 - uniqueTokens)
  it('should track unique tokens for wallet deduplication', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'aave:1',
          chainId: 1,
          protocolName: 'Aave V3',
          canonicalProtocolName: 'aave-v3',
          protocolVersion: 'v3',
          tvl: '1000000',
          dapp: {
            name: 'Aave',
            url: 'https://app.aave.com',
            iconUrl: 'https://logo.url',
            colors: {
              primary: '#B6509E',
              fallback: '#B6509E',
              shadow: '#B6509E',
            },
          },
          portfolioItems: [
            {
              name: PositionName.LENDING,
              updateTime: new Date(),
              detailTypes: [],
              pool: undefined,
              assetDict: {},
              stats: {
                assetValue: '0.5',
                debtValue: '0',
                netValue: '0.5',
              },
              detail: {
                supplyTokenList: [
                  {
                    asset: createMockAsset({
                      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                      symbol: 'USDC',
                      name: 'USD Coin',
                      iconUrl: 'https://usdc.logo',
                      price: {
                        value: 1,
                        changedAt: new Date(),
                        relativeChange24h: 0,
                      },
                      decimals: 6,
                    }),
                    amount: '1000', // 1000 USDC
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
      uniqueTokens: ['usdc', 'aave'],
    };

    const result = processPositions(mockResult, TEST_PARAMS.currency);

    // Should pass through unique tokens for wallet deduplication
    expect(result.positionTokens).toEqual(['usdc', 'aave']);
  });
});
