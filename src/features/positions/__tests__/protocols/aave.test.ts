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
      createMockStats('aave', { totalDeposits: '20000', totalBorrows: '5000', totalRewards: '1000', totalLocked: '0' })
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
      createMockStats('aave', { totalDeposits: '5000', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
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
      createMockStats('aave', { totalDeposits: '3000', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
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

  it('should not duplicate pair values across individual tokens (WETH/USDC issue)', () => {
    // Test for the reported issue where $896.20 was shown for both WETH and USDC
    // when this was actually the sum of the pair
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'aave:pair-1',
          protocolName: 'Aave V3',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v3',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '896.20', // Total for the pair
          debtValue: '0',
          netValue: '896.20',
          tokens: {
            supplyTokenList: [
              // Individual token values should be different, not both $896.20
              { amount: '0.2', asset: createMockAsset('WETH', 2731), assetValue: '546.20' },
              { amount: '350', asset: createMockAsset('USDC', 1), assetValue: '350.00' },
            ],
          },
        }),
      ],
      createMockStats('aave', { totalDeposits: '896.20', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
    );

    const result = transformPositions(mockResponse, FIXTURE_PARAMS);
    const aavePosition = result.positions['aave'];

    // Verify we have 2 deposits
    expect(aavePosition.deposits.length).toBe(2);

    // Find individual deposits
    const wethDeposit = aavePosition.deposits.find(d => d.asset.symbol === 'WETH');
    const usdcDeposit = aavePosition.deposits.find(d => d.asset.symbol === 'USDC');

    expect(wethDeposit).toBeDefined();
    expect(usdcDeposit).toBeDefined();

    // Verify individual values are NOT the sum
    expect(wethDeposit?.value?.amount).toBe('546.20');
    expect(usdcDeposit?.value?.amount).toBe('350.00');

    // Values should be different (not both showing the sum)
    expect(wethDeposit?.value?.amount).not.toBe(usdcDeposit?.value?.amount);

    // The sum of individual values should equal the position total
    const wethValue = parseFloat(wethDeposit?.value?.amount || '0');
    const usdcValue = parseFloat(usdcDeposit?.value?.amount || '0');
    expect(wethValue + usdcValue).toBeCloseTo(896.2, 2);

    // Position total should be the sum
    expect(parseFloat(aavePosition.totals.total.amount)).toBeCloseTo(896.2, 2);
  });

  it('should handle multiple token pairs without value duplication', () => {
    // Test multiple pairs as reported: WETH/USDC, WETH/USDT, USDT/USDC, WETH/AAVE
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'aave:multi-pair',
          protocolName: 'Aave V3',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v3',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '3500',
          debtValue: '0',
          netValue: '3500',
          tokens: {
            supplyTokenList: [
              { amount: '0.5', asset: createMockAsset('WETH', 3000), assetValue: '1500' },
              { amount: '800', asset: createMockAsset('USDC', 1), assetValue: '800' },
              { amount: '700', asset: createMockAsset('USDT', 1), assetValue: '700' },
              { amount: '3.125', asset: createMockAsset('AAVE', 160), assetValue: '500' },
            ],
          },
        }),
      ],
      createMockStats('aave', { totalDeposits: '3500', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
    );

    const result = transformPositions(mockResponse, FIXTURE_PARAMS);
    const aavePosition = result.positions['aave'];

    // Verify all 4 deposits exist
    expect(aavePosition.deposits.length).toBe(4);

    // Get all individual deposits
    const deposits = {
      weth: aavePosition.deposits.find(d => d.asset.symbol === 'WETH'),
      usdc: aavePosition.deposits.find(d => d.asset.symbol === 'USDC'),
      usdt: aavePosition.deposits.find(d => d.asset.symbol === 'USDT'),
      aave: aavePosition.deposits.find(d => d.asset.symbol === 'AAVE'),
    };

    // Verify each has its own distinct value
    expect(deposits.weth?.value?.amount).toBe('1500');
    expect(deposits.usdc?.value?.amount).toBe('800');
    expect(deposits.usdt?.value?.amount).toBe('700');
    expect(deposits.aave?.value?.amount).toBe('500');

    // Verify no two deposits have the same value (no duplication)
    const values = Object.values(deposits)
      .map(d => d?.value?.amount)
      .filter(Boolean);
    const uniqueValues = [...new Set(values)];
    expect(uniqueValues.length).toBe(values.length);

    // Sum should equal position total
    const totalSum = Object.values(deposits).reduce((sum, d) => sum + parseFloat(d?.value?.amount || '0'), 0);
    expect(totalSum).toBeCloseTo(3500, 2);
  });
});
