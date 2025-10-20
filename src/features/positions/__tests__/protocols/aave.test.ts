/**
 * Tests for Aave lending protocol positions
 *
 * Tests LENDING position type with:
 * - Supply tokens (deposits)
 * - Borrow tokens (borrows)
 * - Reward tokens (AAVE incentives)
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

// Mock config to avoid React Native gesture handler imports
jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => false),
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defi_positions_threshold_filter',
}));

function createMockAsset(symbol: string, price = 1): Asset {
  return {
    address: `0x${symbol.toLowerCase()}`,
    chainId: 1,
    name: symbol,
    symbol,
    decimals: 18,
    type: 'erc20',
    iconUrl: `https://example.com/${symbol}.png`,
    network: 'ethereum',
    mainnetAddress: `0x${symbol.toLowerCase()}`,
    verified: true,
    transferable: true,
    creationDate: '2024-01-01T00:00:00Z',
    colors: {
      primary: '#000000',
      fallback: '#ffffff',
    },
    price: {
      value: price,
      changedAt: undefined,
      relativeChange24h: 0,
    },
    networks: {},
    bridging: undefined,
  } as Asset;
}

describe('Aave Protocol', () => {
  it('should parse LENDING position with deposits and borrows', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'aave:1',
          chainId: 1,
          protocolName: 'Aave V3',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v3',
          tvl: '0',
          dapp: {
            name: 'Aave V3',
            url: 'https://aave.com',
            iconUrl: 'https://example.com/aave.png',
            colors: { primary: '#B6509E', fallback: '#B6509E', shadow: '#000000' },
          },
          portfolioItems: [
            {
              name: PositionName.LENDING,
              stats: { assetValue: '1000', debtValue: '0', netValue: '1000' },
              updateTime: undefined,
              detailTypes: [DetailType.LENDING],
              pool: undefined,
              assetDict: {},
              detail: {
                supplyTokenList: [
                  { amount: '10000', asset: createMockAsset('USDC', 1), assetValue: '10000' },
                  { amount: '5', asset: createMockAsset('ETH', 2000), assetValue: '10000' },
                ],
                borrowTokenList: [{ amount: '5000', asset: createMockAsset('DAI', 1), assetValue: '5000' }],
                rewardTokenList: [{ amount: '10', asset: createMockAsset('AAVE', 100), assetValue: '1000' }],
                tokenList: [],
              },
            },
          ],
        },
      ],
      uniqueTokens: [],
      stats: {
        totals: {
          netTotal: '16000',
          totalDeposits: '20000',
          totalBorrows: '5000',
          totalRewards: '1000',
          totalLocked: '0',
          overallTotal: '16000',
        },
        canonicalProtocol: {
          aave: {
            canonicalProtocolName: 'aave',
            protocolIds: ['aave'],
            totals: {
              netTotal: '16000',
              totalDeposits: '20000',
              totalBorrows: '5000',
              totalRewards: '1000',
              totalLocked: '0',
              overallTotal: '16000',
            },
            totalsByChain: {},
          },
        },
      },
    };

    const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
    const result = transformPositions(mockResponse, TEST_PARAMS);

    expect(result.positions['aave']).toBeDefined();
    const aavePosition = result.positions['aave'];

    // Should categorize supply tokens as deposits
    expect(aavePosition.deposits.length).toBeGreaterThan(0);
    const usdcDeposit = aavePosition.deposits.find(d => d.asset.symbol === 'USDC');
    expect(usdcDeposit).toBeDefined();
    expect(usdcDeposit?.quantity).toBe('10000');

    // Should categorize borrow tokens as borrows
    expect(aavePosition.borrows.length).toBeGreaterThan(0);
    const daiBorrow = aavePosition.borrows.find(b => b.asset.symbol === 'DAI');
    expect(daiBorrow).toBeDefined();
    expect(daiBorrow?.quantity).toBe('5000');

    // Should categorize reward tokens as rewards
    expect(aavePosition.rewards.length).toBeGreaterThan(0);
    const aaveReward = aavePosition.rewards.find(r => r.asset.symbol === 'AAVE');
    expect(aaveReward).toBeDefined();
    expect(aaveReward?.quantity).toBe('10');

    // Total should be: (deposits + rewards) - borrows
    // ($10,000 + $10,000 + $1,000) - $5,000 = $16,000
    const totalValue = parseFloat(aavePosition.totals.total.amount);
    expect(totalValue).toBeGreaterThan(15000);
  });

  it('should handle deposit-only positions (no borrows)', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'aave:1',
          chainId: 1,
          protocolName: 'Aave V2',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v2',
          tvl: '0',
          dapp: {
            name: 'Aave V2',
            url: 'https://aave.com',
            iconUrl: 'https://example.com/aave.png',
            colors: { primary: '#B6509E', fallback: '#B6509E', shadow: '#000000' },
          },
          portfolioItems: [
            {
              name: PositionName.LENDING,
              stats: { assetValue: '1000', debtValue: '0', netValue: '1000' },
              updateTime: undefined,
              detailTypes: [DetailType.LENDING],
              pool: undefined,
              assetDict: {},
              detail: {
                supplyTokenList: [{ amount: '5000', asset: createMockAsset('USDC', 1), assetValue: '5000' }],
                borrowTokenList: [],
                rewardTokenList: [],
                tokenList: [],
              },
            },
          ],
        },
      ],
      uniqueTokens: [],
      stats: {
        totals: {
          netTotal: '5000',
          totalDeposits: '5000',
          totalBorrows: '0',
          totalRewards: '0',
          totalLocked: '0',
          overallTotal: '5000',
        },
        canonicalProtocol: {
          aave: {
            canonicalProtocolName: 'aave',
            protocolIds: ['aave'],
            totals: {
              netTotal: '5000',
              totalDeposits: '5000',
              totalBorrows: '0',
              totalRewards: '0',
              totalLocked: '0',
              overallTotal: '5000',
            },
            totalsByChain: {},
          },
        },
      },
    };

    const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
    const result = transformPositions(mockResponse, TEST_PARAMS);

    const aavePosition = result.positions['aave'];
    expect(aavePosition.deposits.length).toBeGreaterThan(0);
    expect(aavePosition.borrows.length).toBe(0);
    expect(aavePosition.rewards.length).toBe(0);

    // Total should equal deposits
    const totalValue = parseFloat(aavePosition.totals.total.amount);
    expect(totalValue).toBeCloseTo(5000, -2);
  });

  it('should aggregate V2 and V3 positions under same protocol', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'aave-v2:1',
          chainId: 1,
          protocolName: 'Aave V2',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v2',
          tvl: '0',
          dapp: {
            name: 'Aave V2',
            url: 'https://aave.com',
            iconUrl: 'https://example.com/aave.png',
            colors: { primary: '#B6509E', fallback: '#B6509E', shadow: '#000000' },
          },
          portfolioItems: [
            {
              name: PositionName.LENDING,
              stats: { assetValue: '1000', debtValue: '0', netValue: '1000' },
              updateTime: undefined,
              detailTypes: [DetailType.LENDING],
              pool: undefined,
              assetDict: {},
              detail: {
                supplyTokenList: [{ amount: '1000', asset: createMockAsset('USDC', 1), assetValue: '1000' }],
                borrowTokenList: [],
                rewardTokenList: [],
                tokenList: [],
              },
            },
          ],
        },
        {
          id: 'aave-v3:1',
          chainId: 1,
          protocolName: 'Aave V3',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v3',
          tvl: '0',
          dapp: {
            name: 'Aave V3',
            url: 'https://aave.com',
            iconUrl: 'https://example.com/aave.png',
            colors: { primary: '#B6509E', fallback: '#B6509E', shadow: '#000000' },
          },
          portfolioItems: [
            {
              name: PositionName.LENDING,
              stats: { assetValue: '1000', debtValue: '0', netValue: '1000' },
              updateTime: undefined,
              detailTypes: [DetailType.LENDING],
              pool: undefined,
              assetDict: {},
              detail: {
                supplyTokenList: [{ amount: '2000', asset: createMockAsset('DAI', 1), assetValue: '2000' }],
                borrowTokenList: [],
                rewardTokenList: [],
                tokenList: [],
              },
            },
          ],
        },
      ],
      uniqueTokens: [],
      stats: {
        totals: {
          netTotal: '3000',
          totalDeposits: '3000',
          totalBorrows: '0',
          totalRewards: '0',
          totalLocked: '0',
          overallTotal: '3000',
        },
        canonicalProtocol: {
          aave: {
            canonicalProtocolName: 'aave',
            protocolIds: ['aave'],
            totals: {
              netTotal: '3000',
              totalDeposits: '3000',
              totalBorrows: '0',
              totalRewards: '0',
              totalLocked: '0',
              overallTotal: '3000',
            },
            totalsByChain: {},
          },
        },
      },
    };

    const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
    const result = transformPositions(mockResponse, TEST_PARAMS);

    // Should aggregate under single "aave" protocol
    expect(Object.keys(result.positions)).toHaveLength(1);
    expect(result.positions['aave']).toBeDefined();

    // Should have deposits from both versions
    const aavePosition = result.positions['aave'];
    expect(aavePosition.deposits.length).toBe(2);

    // Should have a protocol version (either v2 or v3)
    expect(aavePosition.protocolVersion).toBeDefined();
    expect(['v2', 'v3']).toContain(aavePosition.protocolVersion);
  });
});
