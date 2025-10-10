/**
 * Tests for Curve DeFi protocol positions
 *
 * Tests:
 * - LIQUIDITY_POOL position type (pools)
 * - LOCKED position type (veCRV staking)
 * - FARMING position type (gauge staking)
 */

import { transformPositions } from '../../stores/transform';
import { PositionName, type ListPositionsResponse } from '../../types';
import type { ListPositionsResponse_Result } from '../../types/generated/positions/positions';
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

describe('Curve Protocol', () => {
  it('should parse LIQUIDITY_POOL position as pools', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'curve:1',
          chainId: 1,
          protocolName: 'Curve',
          canonicalProtocolName: 'curve',
          protocolVersion: 'v1',
          tvl: '0',
          dapp: {
            name: 'Curve',
            url: 'https://curve.fi',
            iconUrl: 'https://example.com/curve.png',
            colors: { primary: '#FF0000', fallback: '#FF0000', shadow: '#000000' },
          },
          portfolioItems: [
            {
              name: PositionName.LIQUIDITY_POOL,
              stats: undefined,
              updateTime: undefined,
              detailTypes: [],
              pool: undefined,
              assetDict: {},
              detail: {
                supplyTokenList: [
                  { amount: '1000', asset: createMockAsset('DAI', 1) },
                  { amount: '1000', asset: createMockAsset('USDC', 1) },
                  { amount: '1000', asset: createMockAsset('USDT', 1) },
                ],
                rewardTokenList: [],
                borrowTokenList: [],
                tokenList: [],
              },
            },
          ],
        },
      ],
      uniqueTokens: [],
    };

    const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
    const result = transformPositions(mockResponse, TEST_PARAMS);

    expect(result.positions['curve']).toBeDefined();
    const curvePosition = result.positions['curve'];

    // LIQUIDITY_POOL should create pool positions, not deposits
    expect(curvePosition.pools.length).toBeGreaterThan(0);
    expect(curvePosition.deposits.length).toBe(0);

    // Should have underlying assets
    const pool = curvePosition.pools[0];
    expect(pool.underlying.length).toBe(3);
  });

  it('should parse LOCKED position as stakes', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'curve:1',
          chainId: 1,
          protocolName: 'Curve',
          canonicalProtocolName: 'curve',
          protocolVersion: 'v1',
          tvl: '0',
          dapp: {
            name: 'Curve',
            url: 'https://curve.fi',
            iconUrl: 'https://example.com/curve.png',
            colors: { primary: '#FF0000', fallback: '#FF0000', shadow: '#000000' },
          },
          portfolioItems: [
            {
              name: PositionName.LOCKED,
              stats: undefined,
              updateTime: undefined,
              detailTypes: [],
              pool: undefined,
              assetDict: {},
              detail: {
                supplyTokenList: [{ amount: '1000', asset: createMockAsset('CRV', 2) }],
                rewardTokenList: [],
                borrowTokenList: [],
                tokenList: [],
              },
            },
          ],
        },
      ],
      uniqueTokens: [],
    };

    const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
    const result = transformPositions(mockResponse, TEST_PARAMS);

    const curvePosition = result.positions['curve'];

    // LOCKED should go to stakes, not deposits
    expect(curvePosition.stakes.length).toBeGreaterThan(0);
    expect(curvePosition.deposits.length).toBe(0);
    expect(curvePosition.stakes[0].asset.symbol).toBe('CRV');
    expect(curvePosition.stakes[0].quantity).toBe('1000');
  });

  it('should parse FARMING position as stakes', () => {
    const mockResult: ListPositionsResponse_Result = {
      positions: [
        {
          id: 'curve:1',
          chainId: 1,
          protocolName: 'Curve',
          canonicalProtocolName: 'curve',
          protocolVersion: 'v1',
          tvl: '0',
          dapp: {
            name: 'Curve',
            url: 'https://curve.fi',
            iconUrl: 'https://example.com/curve.png',
            colors: { primary: '#FF0000', fallback: '#FF0000', shadow: '#000000' },
          },
          portfolioItems: [
            {
              name: PositionName.FARMING,
              stats: undefined,
              updateTime: undefined,
              detailTypes: [],
              pool: undefined,
              assetDict: {},
              detail: {
                supplyTokenList: [{ amount: '500', asset: createMockAsset('3CRV', 1.1) }],
                rewardTokenList: [{ amount: '10', asset: createMockAsset('CRV', 2) }],
                borrowTokenList: [],
                tokenList: [],
              },
            },
          ],
        },
      ],
      uniqueTokens: [],
    };

    const mockResponse: ListPositionsResponse = { result: mockResult, errors: [], metadata: undefined };
    const result = transformPositions(mockResponse, TEST_PARAMS);

    const curvePosition = result.positions['curve'];

    // FARMING should create stakes from supply tokens
    expect(curvePosition.stakes.length).toBeGreaterThan(0);
    expect(curvePosition.stakes[0].asset.symbol).toBe('3CRV');

    // Should also have rewards
    expect(curvePosition.rewards.length).toBeGreaterThan(0);
    expect(curvePosition.rewards[0].asset.symbol).toBe('CRV');
  });
});
