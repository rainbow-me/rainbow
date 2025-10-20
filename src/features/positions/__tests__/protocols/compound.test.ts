/**
 * Tests for Compound lending protocol positions
 *
 * Tests:
 * - LENDING position type
 * - REWARDS position type
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

describe('Compound Protocol', () => {
  it('should parse LENDING position with supply and borrow', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'compound:1',
          chainId: 1,
          protocolName: 'Compound V3',
          canonicalProtocolName: 'compound',
          protocolVersion: 'v3',
          tvl: '0',
          dapp: {
            name: 'Compound',
            url: 'https://compound.finance',
            iconUrl: 'https://example.com/compound.png',
            colors: { primary: '#00D395', fallback: '#00D395', shadow: '#000000' },
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
                supplyTokenList: [{ amount: '50000', asset: createMockAsset('USDC', 1), assetValue: '50000' }],
                borrowTokenList: [{ amount: '10', asset: createMockAsset('ETH', 2000), assetValue: '20000' }],
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
          netTotal: '30000',
          totalDeposits: '50000',
          totalBorrows: '20000',
          totalRewards: '0',
          totalLocked: '0',
          overallTotal: '30000',
        },
        canonicalProtocol: {
          compound: {
            canonicalProtocolName: 'compound',
            protocolIds: ['compound'],
            totals: {
              netTotal: '30000',
              totalDeposits: '50000',
              totalBorrows: '20000',
              totalRewards: '0',
              totalLocked: '0',
              overallTotal: '30000',
            },
            totalsByChain: {},
          },
        },
      },
    };

    const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
    const result = transformPositions(mockResponse, TEST_PARAMS);

    expect(result.positions['compound']).toBeDefined();
    const compoundPosition = result.positions['compound'];

    // Should have deposits from supply
    expect(compoundPosition.deposits.length).toBeGreaterThan(0);
    expect(compoundPosition.deposits[0].asset.symbol).toBe('USDC');
    expect(compoundPosition.deposits[0].quantity).toBe('50000');

    // Should have borrows
    expect(compoundPosition.borrows.length).toBeGreaterThan(0);
    expect(compoundPosition.borrows[0].asset.symbol).toBe('ETH');
    expect(compoundPosition.borrows[0].quantity).toBe('10');

    // Net value: $50,000 - $20,000 = $30,000
    const totalValue = parseFloat(compoundPosition.totals.total.amount);
    expect(totalValue).toBeCloseTo(30000, -2);
  });

  it('should parse REWARDS position type', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'compound:1',
          chainId: 1,
          protocolName: 'Compound',
          canonicalProtocolName: 'compound',
          protocolVersion: 'v2',
          tvl: '0',
          dapp: {
            name: 'Compound',
            url: 'https://compound.finance',
            iconUrl: 'https://example.com/compound.png',
            colors: { primary: '#00D395', fallback: '#00D395', shadow: '#000000' },
          },
          portfolioItems: [
            {
              name: PositionName.REWARDS,
              stats: { assetValue: '1000', debtValue: '0', netValue: '1000' },
              updateTime: undefined,
              detailTypes: [DetailType.LENDING],
              pool: undefined,
              assetDict: {},
              detail: {
                supplyTokenList: [],
                borrowTokenList: [],
                rewardTokenList: [{ amount: '5', asset: createMockAsset('COMP', 50), assetValue: '250' }],
                tokenList: [],
              },
            },
          ],
        },
      ],
      uniqueTokens: [],
      stats: {
        totals: {
          netTotal: '250',
          totalDeposits: '0',
          totalBorrows: '0',
          totalRewards: '250',
          totalLocked: '0',
          overallTotal: '250',
        },
        canonicalProtocol: {
          compound: {
            canonicalProtocolName: 'compound',
            protocolIds: ['compound'],
            totals: {
              netTotal: '250',
              totalDeposits: '0',
              totalBorrows: '0',
              totalRewards: '250',
              totalLocked: '0',
              overallTotal: '250',
            },
            totalsByChain: {},
          },
        },
      },
    };

    const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
    const result = transformPositions(mockResponse, TEST_PARAMS);

    const compoundPosition = result.positions['compound'];

    // Should have rewards
    expect(compoundPosition.rewards.length).toBeGreaterThan(0);
    expect(compoundPosition.rewards[0].asset.symbol).toBe('COMP');
    expect(compoundPosition.rewards[0].quantity).toBe('5');

    // Rewards should contribute to total
    const rewardValue = parseFloat(compoundPosition.totals.totalRewards.amount);
    expect(rewardValue).toBeCloseTo(250, -1); // 5 * $50
  });

  it('should handle combined lending and rewards', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'compound:1',
          chainId: 1,
          protocolName: 'Compound',
          canonicalProtocolName: 'compound',
          protocolVersion: 'v2',
          tvl: '0',
          dapp: {
            name: 'Compound',
            url: 'https://compound.finance',
            iconUrl: 'https://example.com/compound.png',
            colors: { primary: '#00D395', fallback: '#00D395', shadow: '#000000' },
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
                supplyTokenList: [{ amount: '10000', asset: createMockAsset('DAI', 1), assetValue: '10000' }],
                borrowTokenList: [],
                rewardTokenList: [{ amount: '2', asset: createMockAsset('COMP', 50), assetValue: '100' }],
                tokenList: [],
              },
            },
          ],
        },
      ],
      uniqueTokens: [],
      stats: {
        totals: {
          netTotal: '10100',
          totalDeposits: '10000',
          totalBorrows: '0',
          totalRewards: '100',
          totalLocked: '0',
          overallTotal: '10100',
        },
        canonicalProtocol: {
          compound: {
            canonicalProtocolName: 'compound',
            protocolIds: ['compound'],
            totals: {
              netTotal: '10100',
              totalDeposits: '10000',
              totalBorrows: '0',
              totalRewards: '100',
              totalLocked: '0',
              overallTotal: '10100',
            },
            totalsByChain: {},
          },
        },
      },
    };

    const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
    const result = transformPositions(mockResponse, TEST_PARAMS);

    const compoundPosition = result.positions['compound'];

    // Should have both deposits and rewards
    expect(compoundPosition.deposits.length).toBeGreaterThan(0);
    expect(compoundPosition.rewards.length).toBeGreaterThan(0);

    // Total: $10,000 + $100 = $10,100
    const totalValue = parseFloat(compoundPosition.totals.total.amount);
    expect(totalValue).toBeCloseTo(10100, -2);
  });
});
