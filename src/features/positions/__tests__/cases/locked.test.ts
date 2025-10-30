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

/**
 * Locked Position Test Cases
 *
 * These tests are based on real position data patterns from Rainbow users.
 * Data has been anonymized and normalized for testing purposes.
 *
 * Real-world scenario: User with mixed locked and unlocked positions
 * - Total portfolio value: ~$620
 * - Locked positions: ~$1.85 (time-locked farming rewards)
 * - Unlocked positions: ~$619
 */
describe('Locked Position Calculations', () => {
  describe('overallTotal calculation', () => {
    it('should include locked value in position totals (overallTotal = netTotal + totalLocked)', () => {
      // Based on real farming position with time-locked rewards
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'protocol:1',
            protocolName: 'DeFi Protocol',
            canonicalProtocolName: 'protocol',
            protocolVersion: 'v1',
            positionName: PositionName.LOCKED,
            detailType: DetailType.LOCKED,
            assetValue: '1.85',
            debtValue: '0',
            netValue: '1.85',
            tokens: {
              supplyTokenList: [{ amount: '0.925', asset: createMockAsset('REWARD', 2), assetValue: '1.85' }],
            },
          }),
        ],
        createMockStats('protocol', {
          totalDeposits: '0',
          totalBorrows: '0',
          totalRewards: '0',
          totalLocked: '1.85',
        })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
      const position = result.positions['protocol'];

      // Position total should be overallTotal (includes locked)
      expect(position.totals.total.amount).toBe('1.85');
      expect(position.totals.totalLocked.amount).toBe('1.85');
    });

    it('should correctly calculate overallTotal with mixed locked and unlocked positions', () => {
      // Realistic scenario: User with both lending deposits and locked farming rewards
      // Pattern from real user data: ~$620 total, ~$1.85 locked
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'lending:1',
            protocolName: 'Lending Protocol',
            canonicalProtocolName: 'lending',
            protocolVersion: 'v2',
            positionName: PositionName.LENDING,
            detailType: DetailType.LENDING,
            assetValue: '618.97',
            debtValue: '0',
            netValue: '618.97',
            tokens: {
              supplyTokenList: [
                { amount: '308.485', asset: createMockAsset('USDC', 1), assetValue: '308.485' },
                { amount: '310.485', asset: createMockAsset('DAI', 1), assetValue: '310.485' },
              ],
            },
          }),
          createMockPosition({
            id: 'farming:1',
            protocolName: 'Farming Protocol',
            canonicalProtocolName: 'farming',
            protocolVersion: 'v1',
            positionName: PositionName.LOCKED,
            detailType: DetailType.LOCKED,
            assetValue: '1.85',
            debtValue: '0',
            netValue: '1.85',
            tokens: {
              supplyTokenList: [{ amount: '0.925', asset: createMockAsset('REWARD', 2), assetValue: '1.85' }],
            },
          }),
        ],
        {
          totals: {
            netTotal: '618.97',
            totalDeposits: '618.97',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '1.85',
            overallTotal: '620.82', // netTotal + totalLocked
          },
          canonicalProtocol: {
            lending: {
              canonicalProtocolName: 'lending',
              protocolIds: ['lending'],
              totals: {
                netTotal: '618.97',
                totalDeposits: '618.97',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '618.97',
              },
              totalsByChain: {},
            },
            farming: {
              canonicalProtocolName: 'farming',
              protocolIds: ['farming'],
              totals: {
                netTotal: '0',
                totalDeposits: '0',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '1.85',
                overallTotal: '1.85',
              },
              totalsByChain: {},
            },
          },
        }
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);

      // Grand totals should include locked
      expect(result.totals.total.amount).toBe('620.82');
      expect(result.totals.totalLocked.amount).toBe('1.85');

      // Lending position (unlocked)
      expect(result.positions['lending'].totals.total.amount).toBe('618.97');
      expect(result.positions['lending'].totals.totalLocked.amount).toBe('0');
      expect(result.positions['lending'].deposits.length).toBe(2);

      // Farming position (locked)
      expect(result.positions['farming'].totals.total.amount).toBe('1.85');
      expect(result.positions['farming'].totals.totalLocked.amount).toBe('1.85');
      expect(result.positions['farming'].stakes.length).toBe(1);
    });

    it('should handle position with no locked stakes', () => {
      // Common scenario: Simple lending position with no locked rewards
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'lending:1',
            protocolName: 'Lending Protocol',
            canonicalProtocolName: 'lending',
            protocolVersion: 'v3',
            positionName: PositionName.LENDING,
            detailType: DetailType.LENDING,
            assetValue: '500',
            debtValue: '0',
            netValue: '500',
            tokens: {
              supplyTokenList: [{ amount: '500', asset: createMockAsset('USDC', 1), assetValue: '500' }],
            },
          }),
        ],
        createMockStats('lending', {
          totalDeposits: '500',
          totalBorrows: '0',
          totalRewards: '0',
          totalLocked: '0',
        })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
      const position = result.positions['lending'];

      // With no locked, overallTotal = netTotal
      expect(position.totals.total.amount).toBe('500');
      expect(position.totals.totalLocked.amount).toBe('0');
    });
  });

  describe('locked LP positions', () => {
    it('should handle locked LP farming positions correctly', () => {
      // Realistic LP farming scenario with time-locked rewards
      // Pattern: Multi-token LP stake with locked period
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'lp-farm:1',
            protocolName: 'LP Farming Protocol',
            canonicalProtocolName: 'lp-farm',
            protocolVersion: 'v1',
            positionName: PositionName.LOCKED,
            detailType: DetailType.LOCKED,
            assetValue: '100',
            debtValue: '0',
            netValue: '100',
            tokens: {
              supplyTokenList: [
                { amount: '25', asset: createMockAsset('TOKEN_A', 2), assetValue: '50' },
                { amount: '50', asset: createMockAsset('TOKEN_B', 1), assetValue: '50' },
              ],
            },
          }),
        ],
        createMockStats('lp-farm', {
          totalDeposits: '0',
          totalBorrows: '0',
          totalRewards: '0',
          totalLocked: '100',
        })
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);
      const position = result.positions['lp-farm'];

      // Should create LP stake (multi-token)
      expect(position.stakes.length).toBe(1);
      const stake = position.stakes[0];

      // @ts-expect-error - checking if isLp exists
      expect(stake.isLp).toBe(true);
      // @ts-expect-error - checking if isLocked exists
      expect(stake.isLocked).toBe(true);
      expect(stake.underlying.length).toBe(2);
      expect(position.totals.totalLocked.amount).toBe('100');
    });
  });

  describe('negative net positions with locked collateral', () => {
    it('should handle credit line scenario (borrows > deposits with locked collateral)', () => {
      // Real-world scenario: User borrowing against locked collateral
      // Common in farming strategies where rewards are locked but used as collateral
      const mockResponse = createMockResponse(
        [
          createMockPosition({
            id: 'lending:1',
            protocolName: 'Lending Protocol',
            canonicalProtocolName: 'lending',
            protocolVersion: 'v3',
            positionName: PositionName.LENDING,
            detailType: DetailType.LENDING,
            assetValue: '300',
            debtValue: '350',
            netValue: '-50',
            tokens: {
              supplyTokenList: [{ amount: '200', asset: createMockAsset('ETH', 1.5), assetValue: '300' }],
              borrowTokenList: [{ amount: '350', asset: createMockAsset('USDC', 1), assetValue: '350' }],
            },
          }),
          createMockPosition({
            id: 'farming:1',
            protocolName: 'Farming Protocol',
            canonicalProtocolName: 'farming',
            protocolVersion: 'v1',
            positionName: PositionName.LOCKED,
            detailType: DetailType.LOCKED,
            assetValue: '150',
            debtValue: '0',
            netValue: '150',
            tokens: {
              supplyTokenList: [{ amount: '75', asset: createMockAsset('REWARD', 2), assetValue: '150' }],
            },
          }),
        ],
        {
          totals: {
            netTotal: '-50', // deposits - borrows
            totalDeposits: '300',
            totalBorrows: '350',
            totalRewards: '0',
            totalLocked: '150',
            overallTotal: '100', // netTotal (-50) + totalLocked (150) = 100
          },
          canonicalProtocol: {
            lending: {
              canonicalProtocolName: 'lending',
              protocolIds: ['lending'],
              totals: {
                netTotal: '-50',
                totalDeposits: '300',
                totalBorrows: '350',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '-50',
              },
              totalsByChain: {},
            },
            farming: {
              canonicalProtocolName: 'farming',
              protocolIds: ['farming'],
              totals: {
                netTotal: '0',
                totalDeposits: '0',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '150',
                overallTotal: '150',
              },
              totalsByChain: {},
            },
          },
        }
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);

      // Grand total includes locked (which covers the negative net)
      expect(result.totals.total.amount).toBe('100');
      expect(result.totals.totalLocked.amount).toBe('150');

      // Lending position shows negative net
      expect(result.positions['lending'].totals.total.amount).toBe('-50');
      expect(result.positions['lending'].deposits.length).toBe(1);
      expect(result.positions['lending'].borrows.length).toBe(1);

      // Farming position with locked rewards
      expect(result.positions['farming'].totals.total.amount).toBe('150');
      expect(result.positions['farming'].totals.totalLocked.amount).toBe('150');
      expect(result.positions['farming'].stakes.length).toBe(1);
    });
  });

  describe('grand totals with locked positions', () => {
    it('should aggregate locked values across multiple protocols', () => {
      // Realistic multi-protocol scenario from user data
      // Pattern: User with positions across multiple DeFi protocols
      const mockResponse = createMockResponse(
        [
          // Protocol A: Unlocked lending deposits
          createMockPosition({
            id: 'protocol-a:1',
            protocolName: 'Protocol A',
            canonicalProtocolName: 'protocol-a',
            protocolVersion: 'v2',
            positionName: PositionName.LENDING,
            detailType: DetailType.LENDING,
            assetValue: '400',
            debtValue: '0',
            netValue: '400',
            tokens: {
              supplyTokenList: [{ amount: '400', asset: createMockAsset('USDC', 1), assetValue: '400' }],
            },
          }),
          // Protocol B: Locked farming rewards
          createMockPosition({
            id: 'protocol-b:1',
            protocolName: 'Protocol B',
            canonicalProtocolName: 'protocol-b',
            protocolVersion: 'v1',
            positionName: PositionName.LOCKED,
            detailType: DetailType.LOCKED,
            assetValue: '50',
            debtValue: '0',
            netValue: '50',
            tokens: {
              supplyTokenList: [{ amount: '25', asset: createMockAsset('TOKEN', 2), assetValue: '50' }],
            },
          }),
          // Protocol C: Partially locked positions
          createMockPosition({
            id: 'protocol-c:1',
            protocolName: 'Protocol C',
            canonicalProtocolName: 'protocol-c',
            protocolVersion: 'v1',
            positionName: PositionName.LIQUIDITY_POOL,
            detailType: DetailType.COMMON,
            assetValue: '200',
            debtValue: '0',
            netValue: '200',
            tokens: {
              supplyTokenList: [
                { amount: '100', asset: createMockAsset('TOKEN_X', 1), assetValue: '100' },
                { amount: '100', asset: createMockAsset('TOKEN_Y', 1), assetValue: '100' },
              ],
            },
          }),
          createMockPosition({
            id: 'protocol-c:2',
            protocolName: 'Protocol C',
            canonicalProtocolName: 'protocol-c',
            protocolVersion: 'v1',
            positionName: PositionName.LOCKED,
            detailType: DetailType.LOCKED,
            assetValue: '30',
            debtValue: '0',
            netValue: '30',
            tokens: {
              supplyTokenList: [{ amount: '15', asset: createMockAsset('REWARD_C', 2), assetValue: '30' }],
            },
          }),
        ],
        {
          totals: {
            netTotal: '600', // 400 + 200 from unlocked positions
            totalDeposits: '600',
            totalBorrows: '0',
            totalRewards: '0',
            totalLocked: '80', // 50 + 30 from locked positions
            overallTotal: '680', // netTotal (600) + totalLocked (80)
          },
          canonicalProtocol: {
            'protocol-a': {
              canonicalProtocolName: 'protocol-a',
              protocolIds: ['protocol-a'],
              totals: {
                netTotal: '400',
                totalDeposits: '400',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '0',
                overallTotal: '400',
              },
              totalsByChain: {},
            },
            'protocol-b': {
              canonicalProtocolName: 'protocol-b',
              protocolIds: ['protocol-b'],
              totals: {
                netTotal: '0',
                totalDeposits: '0',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '50',
                overallTotal: '50',
              },
              totalsByChain: {},
            },
            'protocol-c': {
              canonicalProtocolName: 'protocol-c',
              protocolIds: ['protocol-c'],
              totals: {
                netTotal: '200',
                totalDeposits: '200',
                totalBorrows: '0',
                totalRewards: '0',
                totalLocked: '30',
                overallTotal: '230',
              },
              totalsByChain: {},
            },
          },
        }
      );

      const result = transformPositions(mockResponse, FIXTURE_PARAMS);

      // Grand totals should aggregate locked across all protocols
      expect(result.totals.total.amount).toBe('680');
      expect(result.totals.totalLocked.amount).toBe('80');

      // Protocol A: Only unlocked positions
      expect(result.positions['protocol-a'].totals.total.amount).toBe('400');
      expect(result.positions['protocol-a'].totals.totalLocked.amount).toBe('0');
      expect(result.positions['protocol-a'].deposits.length).toBe(1);

      // Protocol B: Only locked positions
      expect(result.positions['protocol-b'].totals.total.amount).toBe('50');
      expect(result.positions['protocol-b'].totals.totalLocked.amount).toBe('50');
      expect(result.positions['protocol-b'].stakes.length).toBe(1);

      // Protocol C: Mixed locked and unlocked
      expect(result.positions['protocol-c'].totals.total.amount).toBe('230');
      expect(result.positions['protocol-c'].totals.totalLocked.amount).toBe('30');
      expect(result.positions['protocol-c'].pools.length).toBe(1);
      expect(result.positions['protocol-c'].stakes.length).toBe(1);
    });
  });
});
