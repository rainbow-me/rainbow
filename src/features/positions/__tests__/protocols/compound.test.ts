import { transformPositions } from '../../stores/transform';
import { PositionName, DetailType } from '../../types/generated/positions/positions';
import { TEST_PARAMS } from '../../__fixtures__/ListPositions';
import { createMockAsset } from '../mocks/assets';
import { createMockStats, createMockPosition, createMockResponse } from '../mocks/positions';

// Mock config to avoid React Native gesture handler imports
jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => false),
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defi_positions_threshold_filter',
}));

describe('Compound Protocol', () => {
  it('should parse LENDING position with supply and borrow', () => {
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'compound:1',
          protocolName: 'Compound V3',
          canonicalProtocolName: 'compound',
          protocolVersion: 'v3',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '1000',
          debtValue: '0',
          netValue: '1000',
          tokens: {
            supplyTokenList: [{ amount: '50000', asset: createMockAsset('USDC', 1), assetValue: '50000' }],
            borrowTokenList: [{ amount: '10', asset: createMockAsset('ETH', 2000), assetValue: '20000' }],
          },
        }),
      ],
      createMockStats('compound', { netTotal: '30000', totalDeposits: '50000', totalBorrows: '20000', totalRewards: '0' })
    );

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
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'compound:1',
          protocolName: 'Compound',
          canonicalProtocolName: 'compound',
          protocolVersion: 'v2',
          positionName: PositionName.REWARDS,
          detailType: DetailType.LENDING,
          assetValue: '1000',
          debtValue: '0',
          netValue: '1000',
          tokens: {
            rewardTokenList: [{ amount: '5', asset: createMockAsset('COMP', 50), assetValue: '250' }],
          },
        }),
      ],
      createMockStats('compound', { netTotal: '250', totalDeposits: '0', totalBorrows: '0', totalRewards: '250' })
    );

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
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'compound:1',
          protocolName: 'Compound',
          canonicalProtocolName: 'compound',
          protocolVersion: 'v2',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '1000',
          debtValue: '0',
          netValue: '1000',
          tokens: {
            supplyTokenList: [{ amount: '10000', asset: createMockAsset('DAI', 1), assetValue: '10000' }],
            rewardTokenList: [{ amount: '2', asset: createMockAsset('COMP', 50), assetValue: '100' }],
          },
        }),
      ],
      createMockStats('compound', { netTotal: '10100', totalDeposits: '10000', totalBorrows: '0', totalRewards: '100' })
    );

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
