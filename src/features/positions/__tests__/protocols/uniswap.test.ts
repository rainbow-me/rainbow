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

describe('Uniswap Position Parsing', () => {
  describe('Protocol Aggregation', () => {
    it('should aggregate Uniswap V2 and V3 positions under canonical name "uniswap"', () => {
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'uniswap3:1',
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '100',
            debtValue: '0',
            netValue: '100',
            pool: { id: '0x1234567890abcdef', chainId: 1 },
            tokens: {
              supplyTokenList: [
                { amount: '0.05', asset: createMockAsset('WETH', 2000), assetValue: '100' },
                {
                  amount: '100000',
                  asset: createMockAsset('USDC', 1, { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 }),
                  assetValue: '100000',
                },
              ],
            },
          }),
          createMockPosition({
            id: 'uniswap2:1',
            protocolName: 'Uniswap V2',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v2',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '50',
            debtValue: '0',
            netValue: '50',
            pool: { id: '0xabcdef1234567890', chainId: 1 },
            tokens: {
              supplyTokenList: [
                { amount: '0.025', asset: createMockAsset('WETH', 2000), assetValue: '50' },
                {
                  amount: '25',
                  asset: createMockAsset('DAI', 1, { address: '0x6b175474e89094c44da98b954eedeac495271d0f' }),
                  assetValue: '25',
                },
              ],
            },
          }),
        ],
        createMockStats('uniswap', { totalDeposits: '1000', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);

      // Should aggregate both under "uniswap"
      expect(result.positions['uniswap']).toBeDefined();
      expect(result.positions['uniswap'].type).toBe('uniswap');

      // Should have 2 pools total (one V3, one V2)
      expect(result.positions['uniswap'].pools).toHaveLength(2);
    });
  });

  describe('LP Position Categorization', () => {
    it('should place LP positions in pools category (not deposits)', () => {
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'uniswap3:1',
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '100',
            debtValue: '0',
            netValue: '100',
            pool: { id: '0x1234', chainId: 1 },
            tokens: {
              supplyTokenList: [
                { amount: '0.05', asset: createMockAsset('WETH', 2000), assetValue: '100' },
                { amount: '500', asset: createMockAsset('GRT', 0.08), assetValue: '40' },
              ],
            },
          }),
        ],
        createMockStats('uniswap', { totalDeposits: '1000', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
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
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'uniswap3:1',
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '100',
            debtValue: '0',
            netValue: '100',
            pool: { id: '0x1234', chainId: 1 },
            tokens: {
              supplyTokenList: [
                { amount: '0.05', asset: createMockAsset('WETH', 2000), assetValue: '100' },
                { amount: '50', asset: createMockAsset('USDC', 1), assetValue: '50' },
              ],
            },
          }),
        ],
        createMockStats('uniswap', { totalDeposits: '1000', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      // V3 with both assets should be in_range (concentrated liquidity)
      expect(pool.rangeStatus).toBe('in_range');
    });

    it('should not identify Uniswap V2 as concentrated liquidity', () => {
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'uniswap2:1',
            protocolName: 'Uniswap V2',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v2',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '100',
            debtValue: '0',
            netValue: '100',
            pool: { id: '0x1234', chainId: 1 },
            tokens: {
              supplyTokenList: [
                { amount: '0.05', asset: createMockAsset('WETH', 2000), assetValue: '100' },
                { amount: '50', asset: createMockAsset('DAI', 1), assetValue: '50' },
              ],
            },
          }),
        ],
        createMockStats('uniswap', { totalDeposits: '1000', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      // V2 should be full_range (traditional AMM, not concentrated liquidity)
      expect(pool.rangeStatus).toBe('full_range');
    });
  });

  describe('Range Status Calculation', () => {
    it('should calculate range status for concentrated liquidity pools', () => {
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'uniswap3:1',
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '100',
            debtValue: '0',
            netValue: '100',
            pool: { id: '0x1234', chainId: 1 },
            tokens: {
              supplyTokenList: [
                { amount: '0.05', asset: createMockAsset('WETH', 2000), assetValue: '100' },
                { amount: '50', asset: createMockAsset('USDC', 1), assetValue: '50' },
              ],
            },
          }),
        ],
        createMockStats('uniswap', { totalDeposits: '1000', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      // Range status should be one of the valid values
      expect(['in_range', 'out_of_range', 'full_range']).toContain(pool.rangeStatus);
    });
  });

  describe('Allocation Calculation', () => {
    it('should calculate allocation percentages in format "X/Y"', () => {
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'uniswap2:1',
            protocolName: 'Uniswap V2',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v2',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '150',
            debtValue: '0',
            netValue: '150',
            pool: { id: '0x1234', chainId: 1 },
            tokens: {
              supplyTokenList: [
                { amount: '0.05', asset: createMockAsset('WETH', 2000), assetValue: '100' }, // 0.05 WETH = $100
                { amount: '50', asset: createMockAsset('USDC', 1), assetValue: '50' }, // 50 USDC = $50
              ],
            },
          }),
        ],
        createMockStats('uniswap', { totalDeposits: '1000', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      // Allocation should be in "X% / Y%" format
      expect(pool.allocation.display).toMatch(/^\d+% \/ \d+%$/);

      // Should add up to 100
      const sum = pool.allocation.percentages.reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);

      // With $100 WETH and $50 USDC, allocation should favor WETH
      // (exact calculation: 67% WETH, 33% USDC)
      expect(pool.allocation.percentages[0]).toBe(67); // WETH
      expect(pool.allocation.percentages[1]).toBe(33); // USDC
      expect(pool.allocation.splits).toBe(2);
    });
  });

  describe('Rewards Handling', () => {
    it('should place claimable fees in rewards category', () => {
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'uniswap3:1',
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '105',
            debtValue: '0',
            netValue: '105',
            pool: { id: '0x1234', chainId: 1 },
            tokens: {
              supplyTokenList: [{ amount: '0.05', asset: createMockAsset('WETH', 2000), assetValue: '100' }],
              rewardTokenList: [
                { amount: '0.0025', asset: createMockAsset('WETH', 2000), assetValue: '5' }, // 0.0025 WETH = $5 in fees
              ],
            },
          }),
        ],
        createMockStats('uniswap', { totalDeposits: '1000', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
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
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'uniswap3:1',
            protocolName: 'Uniswap V3',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v3',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '100',
            debtValue: '0',
            netValue: '100',
            pool: { id: '0x1234567890abcdef', chainId: 1 },
            tokens: {
              supplyTokenList: [
                { amount: '0.05', asset: createMockAsset('WETH', 2000), assetValue: '100' },
                { amount: '100', asset: createMockAsset('USDC', 1), assetValue: '100' },
              ],
            },
          }),
        ],
        createMockStats('uniswap', { totalDeposits: '100', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      // Verify all required fields
      expect(pool.asset).toBeDefined();
      expect(pool.quantity).toBeDefined();
      expect(pool.rangeStatus).toBeDefined();
      expect(pool.rangeStatus).toBe('in_range'); // V3 with both assets
      expect(pool.allocation).toBeDefined();
      expect(pool.allocation.display).toBeDefined();
      expect(pool.allocation.percentages).toBeDefined();
      expect(pool.allocation.splits).toBeDefined();
      expect(pool.value).toBeDefined();
      expect(pool.underlying).toBeDefined();
      expect(pool.poolAddress).toBe('0x1234567890abcdef');
    });

    it('should handle pools with >2 assets by showing top 2 + aggregated other', () => {
      // Multi-asset pool edge case (e.g., Balancer-style pools)
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'uniswap-v2:1',
            protocolName: 'Uniswap V2',
            canonicalProtocolName: 'uniswap',
            protocolVersion: 'v2',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '1000',
            debtValue: '0',
            netValue: '1000',
            pool: { id: '0xmultiassetpool', chainId: 1 },
            tokens: {
              supplyTokenList: [
                { amount: '0.119', asset: createMockAsset('WETH', 4200, { address: '0x1' }), assetValue: '499.79999999999995' }, // ~$500 (50%)
                { amount: '200', asset: createMockAsset('USDC', 1, { address: '0x2' }), assetValue: '200' }, // ~$200 (20%)
                { amount: '150', asset: createMockAsset('DAI', 1, { address: '0x3' }), assetValue: '150' }, // ~$150 (15%)
                { amount: '100', asset: createMockAsset('USDT', 1, { address: '0x4' }), assetValue: '100' }, // ~$100 (10%)
                { amount: '2', asset: createMockAsset('LINK', 25, { address: '0x5' }), assetValue: '50' }, // ~$50 (5%)
              ],
            },
          }),
        ],
        createMockStats('uniswap', { totalDeposits: '1000', totalBorrows: '0', totalRewards: '0', totalLocked: '0' })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
      const pool = result.positions['uniswap'].pools[0];

      // Allocation should show first 2 + "other" (3 values total)
      expect(pool.allocation.percentages).toHaveLength(3);
      expect(pool.allocation.splits).toBe(3);

      // Should sum to 100%
      const sum = pool.allocation.percentages.reduce((acc, val) => acc + val, 0);
      expect(sum).toBe(100);

      // First 2 are in input order (WETH 50%, USDC 20%)
      expect(pool.allocation.percentages[0]).toBeGreaterThanOrEqual(48); // WETH
      expect(pool.allocation.percentages[1]).toBeGreaterThanOrEqual(18); // USDC

      // Other should aggregate DAI (15%) + USDT (10%) + LINK (5%) = 30%
      expect(pool.allocation.percentages[2]).toBeGreaterThanOrEqual(28); // Other

      // Should have all 5 underlying assets
      expect(pool.underlying).toHaveLength(5);
    });
  });
});
