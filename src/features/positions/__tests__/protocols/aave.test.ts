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

describe('Aave Protocol', () => {
  it('should parse LENDING position with deposits and borrows', () => {
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'aave:1',
          protocolName: 'Aave V3',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v3',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '1000',
          debtValue: '0',
          netValue: '1000',
          tokens: {
            supplyTokenList: [
              { amount: '10000', asset: createMockAsset('USDC', 1), assetValue: '10000' },
              { amount: '5', asset: createMockAsset('ETH', 2000), assetValue: '10000' },
            ],
            borrowTokenList: [{ amount: '5000', asset: createMockAsset('DAI', 1), assetValue: '5000' }],
            rewardTokenList: [{ amount: '10', asset: createMockAsset('AAVE', 100), assetValue: '1000' }],
          },
        }),
      ],
      createMockStats('aave', { netTotal: '16000', totalDeposits: '20000', totalBorrows: '5000', totalRewards: '1000' })
    );

    const result = transformPositions(mockResponse, FIXTURE_PARAMS);

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
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'aave:1',
          protocolName: 'Aave V2',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v2',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '1000',
          debtValue: '0',
          netValue: '1000',
          tokens: {
            supplyTokenList: [{ amount: '5000', asset: createMockAsset('USDC', 1), assetValue: '5000' }],
          },
        }),
      ],
      createMockStats('aave', { netTotal: '5000', totalDeposits: '5000', totalBorrows: '0', totalRewards: '0' })
    );

    const result = transformPositions(mockResponse, FIXTURE_PARAMS);

    const aavePosition = result.positions['aave'];
    expect(aavePosition.deposits.length).toBeGreaterThan(0);
    expect(aavePosition.borrows.length).toBe(0);
    expect(aavePosition.rewards.length).toBe(0);

    // Total should equal deposits
    const totalValue = parseFloat(aavePosition.totals.total.amount);
    expect(totalValue).toBeCloseTo(5000, -2);
  });

  it('should aggregate V2 and V3 positions under same protocol', () => {
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'aave-v2:1',
          protocolName: 'Aave V2',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v2',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '1000',
          debtValue: '0',
          netValue: '1000',
          tokens: {
            supplyTokenList: [{ amount: '1000', asset: createMockAsset('USDC', 1), assetValue: '1000' }],
          },
        }),
        createMockPosition({
          id: 'aave-v3:1',
          protocolName: 'Aave V3',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v3',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '1000',
          debtValue: '0',
          netValue: '1000',
          tokens: {
            supplyTokenList: [{ amount: '2000', asset: createMockAsset('DAI', 1), assetValue: '2000' }],
          },
        }),
      ],
      createMockStats('aave', { netTotal: '3000', totalDeposits: '3000', totalBorrows: '0', totalRewards: '0' })
    );

    const result = transformPositions(mockResponse, FIXTURE_PARAMS);

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
