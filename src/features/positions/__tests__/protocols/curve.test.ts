import { transformPositions } from '../../stores/transform';
import { PositionName, DetailType } from '../../types/generated/positions/positions';
import { FIXTURE_PARAMS } from '../../__fixtures__/ListPositions';
import { createMockAsset } from '../mocks/assets';
import { createMockStats, createMockPosition, createMockResponse } from '../mocks/positions';

// Mock config to avoid React Native gesture handler imports
jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => false),
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defi_positions_threshold_filter',
}));

describe('Curve Protocol', () => {
  it('should parse LIQUIDITY_POOL position as pools', () => {
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'curve:1',
          protocolName: 'Curve',
          canonicalProtocolName: 'curve',
          protocolVersion: 'v1',
          positionName: PositionName.LIQUIDITY_POOL,
          detailType: DetailType.COMMON,
          assetValue: '3000',
          debtValue: '0',
          netValue: '3000',
          tokens: {
            supplyTokenList: [
              { amount: '1000', asset: createMockAsset('DAI', 1), assetValue: '1000' },
              { amount: '1000', asset: createMockAsset('USDC', 1), assetValue: '1000' },
              { amount: '1000', asset: createMockAsset('USDT', 1), assetValue: '1000' },
            ],
          },
        }),
      ],
      createMockStats('curve', { netTotal: '3000', totalDeposits: '3000', totalBorrows: '0', totalRewards: '0' })
    );

    const result = transformPositions(mockResponse, FIXTURE_PARAMS);

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
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'curve:1',
          protocolName: 'Curve',
          canonicalProtocolName: 'curve',
          protocolVersion: 'v1',
          positionName: PositionName.LOCKED,
          detailType: DetailType.LOCKED,
          assetValue: '2000',
          debtValue: '0',
          netValue: '2000',
          tokens: {
            supplyTokenList: [{ amount: '1000', asset: createMockAsset('CRV', 2), assetValue: '2000' }],
          },
        }),
      ],
      createMockStats('curve', { netTotal: '2000', totalDeposits: '2000', totalBorrows: '0', totalRewards: '0', totalLocked: '2000' })
    );

    const result = transformPositions(mockResponse, FIXTURE_PARAMS);

    const curvePosition = result.positions['curve'];

    // LOCKED should go to stakes, not deposits
    expect(curvePosition.stakes.length).toBeGreaterThan(0);
    expect(curvePosition.deposits.length).toBe(0);
    expect(curvePosition.stakes[0].asset.symbol).toBe('CRV');
    expect(curvePosition.stakes[0].quantity).toBe('1000');
  });

  it('should parse FARMING position as stakes', () => {
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'curve:1',
          protocolName: 'Curve',
          canonicalProtocolName: 'curve',
          protocolVersion: 'v1',
          positionName: PositionName.FARMING,
          detailType: DetailType.COMMON,
          assetValue: '550',
          debtValue: '0',
          netValue: '550',
          tokens: {
            supplyTokenList: [{ amount: '500', asset: createMockAsset('3CRV', 1.1), assetValue: '550' }],
            rewardTokenList: [{ amount: '10', asset: createMockAsset('CRV', 2), assetValue: '20' }],
          },
        }),
      ],
      createMockStats('curve', { netTotal: '570', totalDeposits: '550', totalBorrows: '0', totalRewards: '20' })
    );

    const result = transformPositions(mockResponse, FIXTURE_PARAMS);

    const curvePosition = result.positions['curve'];

    // FARMING with COMMON detail type and single supply token creates deposits
    // (If it were multi-token, it would create pools)
    expect(curvePosition.deposits.length).toBeGreaterThan(0);
    expect(curvePosition.deposits[0].asset.symbol).toBe('3CRV');

    // Should also have rewards
    expect(curvePosition.rewards.length).toBeGreaterThan(0);
    expect(curvePosition.rewards[0].asset.symbol).toBe('CRV');
  });
});
