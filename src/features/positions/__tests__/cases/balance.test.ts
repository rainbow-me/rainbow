import { transformPositions } from '../../stores/transform';
import { usePositionsStore } from '../../stores/positionsStore';
import { PositionName, DetailType } from '../../types/generated/positions/positions';
import { FIXTURE_PARAMS } from '../../__fixtures__/ListPositions';
import { createMockAsset } from '../mocks/assets';
import { createMockStats, createMockPosition, createMockResponse } from '../mocks/positions';

// Mock config to avoid React Native gesture handler imports
jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => false),
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defi_positions_threshold_filter',
}));

jest.mock('@/config/experimentalHooks', () => ({}));
jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  useBackendNetworksStore: {
    getState: () => ({
      getSupportedPositionsChainIds: () => [1, 10, 137],
    }),
    subscribe: jest.fn(),
  },
}));
jest.mock('@/state/assets/userAssetsStoreManager', () => {
  const { createStore: createZustandStore } = jest.requireActual<typeof import('zustand/vanilla')>('zustand/vanilla');
  const { FIXTURE_PARAMS: params, FIXTURE_WALLET_ADDRESS: address } =
    jest.requireActual<typeof import('../../__fixtures__/ListPositions')>('../../__fixtures__/ListPositions');
  return {
    userAssetsStoreManager: createZustandStore(() => ({
      address,
      currency: params.currency,
    })),
  };
});

/**
 * Integration Tests for Complete Wallet Balance Calculation
 *
 * These tests verify the end-to-end flow of wallet balance calculation,
 * ensuring all position types contribute correctly to the final wallet balance.
 * This includes handling of locked positions, negative net positions, LST/LSD filtering,
 * and proper aggregation across multiple protocols.
 */
describe('Wallet Balance Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    usePositionsStore.setState({
      queryCache: {},
      queryKey: '',
    });
  });

  it('should calculate correct wallet balance with all position types', () => {
    // Comprehensive test with all position types and edge cases
    const mockResponse = createMockResponse(
      [
        // 1. Standard lending position (Aave)
        createMockPosition({
          id: 'aave:1',
          protocolName: 'Aave V3',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v3',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '10000',
          debtValue: '2000',
          netValue: '8000',
          tokens: {
            supplyTokenList: [
              { amount: '5000', asset: createMockAsset('USDC', 1), assetValue: '5000' },
              { amount: '2.5', asset: createMockAsset('WETH', 2000), assetValue: '5000' },
            ],
            borrowTokenList: [{ amount: '2000', asset: createMockAsset('DAI', 1), assetValue: '2000' }],
            rewardTokenList: [{ amount: '50', asset: createMockAsset('AAVE', 100), assetValue: '5000' }],
          },
        }),
        // 2. Liquidity pool position (Uniswap)
        createMockPosition({
          id: 'uniswap:1',
          protocolName: 'Uniswap V3',
          canonicalProtocolName: 'uniswap',
          protocolVersion: 'v3',
          positionName: PositionName.LIQUIDITY_POOL,
          detailType: DetailType.COMMON,
          assetValue: '3000',
          debtValue: '0',
          netValue: '3000',
          tokens: {
            supplyTokenList: [
              { amount: '1', asset: createMockAsset('WETH', 1800), assetValue: '1800' },
              { amount: '1200', asset: createMockAsset('USDC', 1), assetValue: '1200' },
            ],
          },
        }),
        // 3. Locked/staked position (Virtual tokens)
        createMockPosition({
          id: 'virtuals:1',
          protocolName: 'Virtuals Protocol',
          canonicalProtocolName: 'virtuals',
          protocolVersion: 'v1',
          positionName: PositionName.LOCKED,
          detailType: DetailType.LOCKED,
          assetValue: '2500',
          debtValue: '0',
          netValue: '2500',
          tokens: {
            supplyTokenList: [{ amount: '2500', asset: createMockAsset('VIRTUAL', 1), assetValue: '2500' }],
          },
        }),
        // 4. Staking position with rewards
        createMockPosition({
          id: 'staking:1',
          protocolName: 'Staking Protocol',
          canonicalProtocolName: 'staking',
          protocolVersion: 'v1',
          positionName: PositionName.STAKED,
          detailType: DetailType.COMMON,
          assetValue: '1500',
          debtValue: '0',
          netValue: '1500',
          tokens: {
            supplyTokenList: [{ amount: '1500', asset: createMockAsset('STAKE', 1), assetValue: '1500' }],
            rewardTokenList: [{ amount: '100', asset: createMockAsset('REWARD', 3), assetValue: '300' }],
          },
        }),
        // 5. Credit line position (negative net)
        createMockPosition({
          id: 'compound:1',
          protocolName: 'Compound V3',
          canonicalProtocolName: 'compound',
          protocolVersion: 'v3',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '500',
          debtValue: '1200',
          netValue: '-700',
          tokens: {
            supplyTokenList: [{ amount: '500', asset: createMockAsset('USDT', 1), assetValue: '500' }],
            borrowTokenList: [{ amount: '1200', asset: createMockAsset('USDC', 1), assetValue: '1200' }],
          },
        }),
      ],
      {
        totals: {
          // Net calculation: 8000 + 3000 + 1500 + 300 - 700 = 12100 (excluding locked)
          netTotal: '12100',
          totalDeposits: '15000', // 10000 + 3000 + 1500 + 500
          totalBorrows: '3200', // 2000 + 1200
          totalRewards: '5300', // 5000 + 300
          totalLocked: '2500', // Virtual tokens only
          overallTotal: '14600', // netTotal (12100) + totalLocked (2500)
        },
        canonicalProtocol: {
          aave: {
            canonicalProtocolName: 'aave',
            protocolIds: ['aave'],
            totals: {
              netTotal: '8000',
              totalDeposits: '10000',
              totalBorrows: '2000',
              totalRewards: '5000',
              totalLocked: '0',
              overallTotal: '8000',
            },
            totalsByChain: {},
          },
          uniswap: {
            canonicalProtocolName: 'uniswap',
            protocolIds: ['uniswap'],
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
          virtuals: {
            canonicalProtocolName: 'virtuals',
            protocolIds: ['virtuals'],
            totals: {
              netTotal: '0',
              totalDeposits: '0',
              totalBorrows: '0',
              totalRewards: '0',
              totalLocked: '2500',
              overallTotal: '2500',
            },
            totalsByChain: {},
          },
          staking: {
            canonicalProtocolName: 'staking',
            protocolIds: ['staking'],
            totals: {
              netTotal: '1800', // 1500 + 300 rewards
              totalDeposits: '1500',
              totalBorrows: '0',
              totalRewards: '300',
              totalLocked: '0',
              overallTotal: '1800',
            },
            totalsByChain: {},
          },
          compound: {
            canonicalProtocolName: 'compound',
            protocolIds: ['compound'],
            totals: {
              netTotal: '-700',
              totalDeposits: '500',
              totalBorrows: '1200',
              totalRewards: '0',
              totalLocked: '0',
              overallTotal: '-700',
            },
            totalsByChain: {},
          },
        },
      }
    );

    // Transform the positions
    const transformedData = transformPositions(mockResponse, FIXTURE_PARAMS);

    // Store the transformed data in positionsStore
    const queryKey = `${FIXTURE_PARAMS.address}-${FIXTURE_PARAMS.currency}`;
    const store = usePositionsStore.getState();
    store.queryCache[queryKey] = {
      data: transformedData,
      lastFetchedAt: Date.now(),
      cacheTime: 0,
      errorInfo: null,
    };
    usePositionsStore.setState({ queryKey });

    const walletBalance = usePositionsStore.getState().getBalance();

    // Expected calculation from tickets:
    // Total (overallTotal): 14600 (12100 unlocked + 2500 locked)
    // Locked: 2500
    // Wallet balance: 12100 (excludes locked positions)
    expect(walletBalance).toBe('12100');

    // Verify individual protocol contributions
    // Note: The transform process uses the backend-provided totals, not summing rewards separately
    expect(transformedData.positions['aave'].totals.total.amount).toBe('8000'); // Uses overallTotal from backend
    expect(transformedData.positions['uniswap'].totals.total.amount).toBe('3000');
    expect(transformedData.positions['virtuals'].totals.total.amount).toBe('2500');
    expect(transformedData.positions['virtuals'].totals.totalLocked.amount).toBe('2500');
    expect(transformedData.positions['staking'].totals.total.amount).toBe('1800');
    expect(transformedData.positions['compound'].totals.total.amount).toBe('-700');

    // Ensure wallet balance is never negative (ticket requirement)
    expect(parseFloat(walletBalance)).toBeGreaterThanOrEqual(0);
  });

  it('should handle edge case with all positions locked', () => {
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'locked:1',
          protocolName: 'Locked Protocol',
          canonicalProtocolName: 'locked',
          protocolVersion: 'v1',
          positionName: PositionName.LOCKED,
          detailType: DetailType.LOCKED,
          assetValue: '10000',
          debtValue: '0',
          netValue: '10000',
          tokens: {
            supplyTokenList: [{ amount: '10000', asset: createMockAsset('LOCKED', 1), assetValue: '10000' }],
          },
        }),
      ],
      {
        totals: {
          netTotal: '0',
          totalDeposits: '0',
          totalBorrows: '0',
          totalRewards: '0',
          totalLocked: '10000',
          overallTotal: '10000',
        },
        canonicalProtocol: {
          locked: {
            canonicalProtocolName: 'locked',
            protocolIds: ['locked'],
            totals: {
              netTotal: '0',
              totalDeposits: '0',
              totalBorrows: '0',
              totalRewards: '0',
              totalLocked: '10000',
              overallTotal: '10000',
            },
            totalsByChain: {},
          },
        },
      }
    );

    const transformedData = transformPositions(mockResponse, FIXTURE_PARAMS);

    // Store the transformed data in positionsStore
    const queryKey = `${FIXTURE_PARAMS.address}-${FIXTURE_PARAMS.currency}`;
    const store = usePositionsStore.getState();
    store.queryCache[queryKey] = {
      data: transformedData,
      lastFetchedAt: Date.now(),
      cacheTime: 0,
      errorInfo: null,
    };
    usePositionsStore.setState({ queryKey });

    const walletBalance = usePositionsStore.getState().getBalance();

    // All positions are locked, so wallet balance should be 0
    expect(walletBalance).toBe('0');
  });

  it('should handle complex scenario with LST filtering and negative positions', () => {
    const mockResponse = createMockResponse(
      [
        // Position that should be filtered (stETH - LST)
        createMockPosition({
          id: 'lido:1',
          protocolName: 'Lido',
          canonicalProtocolName: 'lido',
          protocolVersion: 'v1',
          positionName: PositionName.STAKED,
          detailType: DetailType.COMMON,
          assetValue: '5000',
          debtValue: '0',
          netValue: '5000',
          tokens: {
            supplyTokenList: [{ amount: '5000', asset: createMockAsset('stETH', 1), assetValue: '5000' }],
          },
          description: 'stETH', // This should trigger filtering
        }),
        // Regular position
        createMockPosition({
          id: 'regular:1',
          protocolName: 'Regular Protocol',
          canonicalProtocolName: 'regular',
          protocolVersion: 'v1',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '3000',
          debtValue: '0',
          netValue: '3000',
          tokens: {
            supplyTokenList: [{ amount: '3000', asset: createMockAsset('USDC', 1), assetValue: '3000' }],
          },
        }),
        // Negative position
        createMockPosition({
          id: 'negative:1',
          protocolName: 'Credit Protocol',
          canonicalProtocolName: 'credit',
          protocolVersion: 'v1',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '1000',
          debtValue: '2500',
          netValue: '-1500',
          tokens: {
            supplyTokenList: [{ amount: '1000', asset: createMockAsset('COLLATERAL', 1), assetValue: '1000' }],
            borrowTokenList: [{ amount: '2500', asset: createMockAsset('BORROWED', 1), assetValue: '2500' }],
          },
        }),
        // Locked position
        createMockPosition({
          id: 'locked:1',
          protocolName: 'Vesting Protocol',
          canonicalProtocolName: 'vesting',
          protocolVersion: 'v1',
          positionName: PositionName.LOCKED,
          detailType: DetailType.LOCKED,
          assetValue: '800',
          debtValue: '0',
          netValue: '800',
          tokens: {
            supplyTokenList: [{ amount: '800', asset: createMockAsset('VESTED', 1), assetValue: '800' }],
          },
        }),
      ],
      {
        totals: {
          netTotal: '6500', // 5000 (lido, to be filtered) + 3000 - 1500 (excluding locked)
          totalDeposits: '9000', // 5000 + 3000 + 1000
          totalBorrows: '2500',
          totalRewards: '0',
          totalLocked: '800',
          overallTotal: '7300', // 6500 + 800
        },
        canonicalProtocol: {
          // lido would be filtered out
          regular: {
            canonicalProtocolName: 'regular',
            protocolIds: ['regular'],
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
          credit: {
            canonicalProtocolName: 'credit',
            protocolIds: ['credit'],
            totals: {
              netTotal: '-1500',
              totalDeposits: '1000',
              totalBorrows: '2500',
              totalRewards: '0',
              totalLocked: '0',
              overallTotal: '-1500',
            },
            totalsByChain: {},
          },
          vesting: {
            canonicalProtocolName: 'vesting',
            protocolIds: ['vesting'],
            totals: {
              netTotal: '0',
              totalDeposits: '0',
              totalBorrows: '0',
              totalRewards: '0',
              totalLocked: '800',
              overallTotal: '800',
            },
            totalsByChain: {},
          },
        },
      }
    );

    const transformedData = transformPositions(mockResponse, FIXTURE_PARAMS);

    // Store the transformed data in positionsStore
    const queryKey = `${FIXTURE_PARAMS.address}-${FIXTURE_PARAMS.currency}`;
    const store = usePositionsStore.getState();
    store.queryCache[queryKey] = {
      data: transformedData,
      lastFetchedAt: Date.now(),
      cacheTime: 0,
      errorInfo: null,
    };
    usePositionsStore.setState({ queryKey });

    // Call ACTUAL store getBalance() method
    const walletBalance = usePositionsStore.getState().getBalance();

    // Expected: 2300 (total) - 800 (locked) = 1500
    // Negative net position (-1500) doesn't affect the result
    expect(walletBalance).toBe('1500');

    // Verify getBalance() guarantee: never negative
    expect(parseFloat(walletBalance)).toBeGreaterThanOrEqual(0);
  });

  it('should floor to 0 with extreme negative positions despite locked collateral', () => {
    // Test extreme edge case with large negative net position
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'extreme:1',
          protocolName: 'Extreme Protocol',
          canonicalProtocolName: 'extreme',
          protocolVersion: 'v1',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '100',
          debtValue: '10000',
          netValue: '-9900',
          tokens: {
            supplyTokenList: [{ amount: '100', asset: createMockAsset('TINY', 1), assetValue: '100' }],
            borrowTokenList: [{ amount: '10000', asset: createMockAsset('HUGE', 1), assetValue: '10000' }],
          },
        }),
        createMockPosition({
          id: 'locked-extreme:1',
          protocolName: 'Locked Extreme',
          canonicalProtocolName: 'locked-extreme',
          protocolVersion: 'v1',
          positionName: PositionName.LOCKED,
          detailType: DetailType.LOCKED,
          assetValue: '20000',
          debtValue: '0',
          netValue: '20000',
          tokens: {
            supplyTokenList: [{ amount: '20000', asset: createMockAsset('BIG_LOCK', 1), assetValue: '20000' }],
          },
        }),
      ],
      {
        totals: {
          netTotal: '-9900',
          totalDeposits: '100',
          totalBorrows: '10000',
          totalRewards: '0',
          totalLocked: '20000',
          overallTotal: '10100', // -9900 + 20000
        },
        canonicalProtocol: {
          'extreme': {
            canonicalProtocolName: 'extreme',
            protocolIds: ['extreme'],
            totals: {
              netTotal: '-9900',
              totalDeposits: '100',
              totalBorrows: '10000',
              totalRewards: '0',
              totalLocked: '0',
              overallTotal: '-9900',
            },
            totalsByChain: {},
          },
          'locked-extreme': {
            canonicalProtocolName: 'locked-extreme',
            protocolIds: ['locked-extreme'],
            totals: {
              netTotal: '0',
              totalDeposits: '0',
              totalBorrows: '0',
              totalRewards: '0',
              totalLocked: '20000',
              overallTotal: '20000',
            },
            totalsByChain: {},
          },
        },
      }
    );

    const transformedData = transformPositions(mockResponse, FIXTURE_PARAMS);

    // Store the transformed data in positionsStore
    const queryKey = `${FIXTURE_PARAMS.address}-${FIXTURE_PARAMS.currency}`;
    const store = usePositionsStore.getState();
    store.queryCache[queryKey] = {
      data: transformedData,
      lastFetchedAt: Date.now(),
      cacheTime: 0,
      errorInfo: null,
    };
    usePositionsStore.setState({ queryKey });

    const walletBalance = usePositionsStore.getState().getBalance();

    // Expected: extreme negative net (-9900) + locked (20000) = 10100 total
    // Wallet balance: 10100 - 20000 = -9900, floored to 0
    expect(walletBalance).toBe('0');

    // Verify getBalance() guarantee: never negative despite extreme values
    expect(parseFloat(walletBalance)).toBeGreaterThanOrEqual(0);
  });

  it('should handle when ALL positions are filtered out', () => {
    // Edge case: Backend returns only token-preferred positions (all get filtered)
    const mockResponse = createMockResponse(
      [
        createMockPosition({
          id: 'lido:1',
          protocolName: 'Lido',
          canonicalProtocolName: 'lido',
          protocolVersion: 'v1',
          positionName: PositionName.STAKED,
          detailType: DetailType.COMMON,
          assetValue: '5000',
          debtValue: '0',
          netValue: '5000',
          description: 'stETH', // This triggers filtering
          tokens: {
            supplyTokenList: [{ amount: '2.5', asset: createMockAsset('stETH', 2000), assetValue: '5000' }],
          },
        }),
        createMockPosition({
          id: 'lido:2',
          protocolName: 'Lido',
          canonicalProtocolName: 'lido',
          protocolVersion: 'v1',
          positionName: PositionName.STAKED,
          detailType: DetailType.COMMON,
          assetValue: '3000',
          debtValue: '0',
          netValue: '3000',
          description: 'wstETH', // This also triggers filtering
          tokens: {
            supplyTokenList: [{ amount: '1.5', asset: createMockAsset('wstETH', 2000), assetValue: '3000' }],
          },
        }),
      ],
      {
        totals: {
          netTotal: '8000',
          totalDeposits: '8000',
          totalBorrows: '0',
          totalRewards: '0',
          totalLocked: '0',
          overallTotal: '8000',
        },
        canonicalProtocol: {
          lido: {
            canonicalProtocolName: 'lido',
            protocolIds: ['lido'],
            totals: {
              netTotal: '8000',
              totalDeposits: '8000',
              totalBorrows: '0',
              totalRewards: '0',
              totalLocked: '0',
              overallTotal: '8000',
            },
            totalsByChain: {},
          },
        },
      }
    );

    const transformedData = transformPositions(mockResponse, FIXTURE_PARAMS);

    // After filtering, grand total should be adjusted
    // Backend says $8000, but all items are filtered, so adjusted total should be $0
    expect(transformedData.totals.total.amount).toBe('0');

    // Store and get balance
    const queryKey = `${FIXTURE_PARAMS.address}-${FIXTURE_PARAMS.currency}`;
    const store = usePositionsStore.getState();
    store.queryCache[queryKey] = {
      data: transformedData,
      lastFetchedAt: Date.now(),
      cacheTime: 0,
      errorInfo: null,
    };
    usePositionsStore.setState({ queryKey });

    const walletBalance = usePositionsStore.getState().getBalance();

    // Wallet balance should be 0 since everything was filtered
    expect(walletBalance).toBe('0');
  });

  it('should handle multiple protocols with token-preferred positions', () => {
    // Multiple protocols, some with filtered items, some without
    const mockResponse = createMockResponse(
      [
        // Lido with wstETH (filtered)
        createMockPosition({
          id: 'lido:1',
          protocolName: 'Lido',
          canonicalProtocolName: 'lido',
          protocolVersion: 'v1',
          positionName: PositionName.STAKED,
          detailType: DetailType.COMMON,
          assetValue: '5000',
          debtValue: '0',
          netValue: '5000',
          description: 'wstETH',
          tokens: {
            supplyTokenList: [{ amount: '2.5', asset: createMockAsset('wstETH', 2000), assetValue: '5000' }],
          },
        }),
        // Aave (not filtered)
        createMockPosition({
          id: 'aave:1',
          protocolName: 'Aave',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v3',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '3000',
          debtValue: '0',
          netValue: '3000',
          tokens: {
            supplyTokenList: [{ amount: '3000', asset: createMockAsset('USDC', 1), assetValue: '3000' }],
          },
        }),
        // Compound (not filtered)
        createMockPosition({
          id: 'compound:1',
          protocolName: 'Compound',
          canonicalProtocolName: 'compound',
          protocolVersion: 'v3',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '2000',
          debtValue: '0',
          netValue: '2000',
          tokens: {
            supplyTokenList: [{ amount: '2000', asset: createMockAsset('DAI', 1), assetValue: '2000' }],
          },
        }),
      ],
      {
        totals: {
          netTotal: '10000', // Backend total including wstETH
          totalDeposits: '10000',
          totalBorrows: '0',
          totalRewards: '0',
          totalLocked: '0',
          overallTotal: '10000',
        },
        canonicalProtocol: {
          lido: {
            canonicalProtocolName: 'lido',
            protocolIds: ['lido'],
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
          compound: {
            canonicalProtocolName: 'compound',
            protocolIds: ['compound'],
            totals: {
              netTotal: '2000',
              totalDeposits: '2000',
              totalBorrows: '0',
              totalRewards: '0',
              totalLocked: '0',
              overallTotal: '2000',
            },
            totalsByChain: {},
          },
        },
      }
    );

    const transformedData = transformPositions(mockResponse, FIXTURE_PARAMS);

    // Grand total should be adjusted: 10000 - 5000 (filtered wstETH) = 5000
    expect(transformedData.totals.total.amount).toBe('5000');

    // Lido position should be filtered out entirely (only had wstETH)
    expect(transformedData.positions['lido']).toBeUndefined();

    // Other positions should remain
    expect(transformedData.positions['aave'].totals.total.amount).toBe('3000');
    expect(transformedData.positions['compound'].totals.total.amount).toBe('2000');

    // Store and get balance
    const queryKey = `${FIXTURE_PARAMS.address}-${FIXTURE_PARAMS.currency}`;
    const store = usePositionsStore.getState();
    store.queryCache[queryKey] = {
      data: transformedData,
      lastFetchedAt: Date.now(),
      cacheTime: 0,
      errorInfo: null,
    };
    usePositionsStore.setState({ queryKey });

    const walletBalance = usePositionsStore.getState().getBalance();

    // Wallet balance should be 5000 (excluding filtered wstETH)
    expect(walletBalance).toBe('5000');
  });

  it('should handle filtered position combined with locked positions', () => {
    // Test interaction between filtering and locked positions
    const mockResponse = createMockResponse(
      [
        // Filtered position (wstETH)
        createMockPosition({
          id: 'lido:1',
          protocolName: 'Lido',
          canonicalProtocolName: 'lido',
          protocolVersion: 'v1',
          positionName: PositionName.STAKED,
          detailType: DetailType.COMMON,
          assetValue: '3000',
          debtValue: '0',
          netValue: '3000',
          description: 'wstETH',
          tokens: {
            supplyTokenList: [{ amount: '1.5', asset: createMockAsset('wstETH', 2000), assetValue: '3000' }],
          },
        }),
        // Regular unlocked position
        createMockPosition({
          id: 'aave:1',
          protocolName: 'Aave',
          canonicalProtocolName: 'aave',
          protocolVersion: 'v3',
          positionName: PositionName.LENDING,
          detailType: DetailType.LENDING,
          assetValue: '5000',
          debtValue: '0',
          netValue: '5000',
          tokens: {
            supplyTokenList: [{ amount: '5000', asset: createMockAsset('USDC', 1), assetValue: '5000' }],
          },
        }),
        // Locked position
        createMockPosition({
          id: 'locked:1',
          protocolName: 'Vesting',
          canonicalProtocolName: 'vesting',
          protocolVersion: 'v1',
          positionName: PositionName.LOCKED,
          detailType: DetailType.LOCKED,
          assetValue: '2000',
          debtValue: '0',
          netValue: '2000',
          tokens: {
            supplyTokenList: [{ amount: '2000', asset: createMockAsset('LOCKED', 1), assetValue: '2000' }],
          },
        }),
      ],
      {
        totals: {
          netTotal: '8000', // Backend: 5000 (aave) + 3000 (wstETH, to be filtered)
          totalDeposits: '8000',
          totalBorrows: '0',
          totalRewards: '0',
          totalLocked: '2000',
          overallTotal: '10000', // 8000 + 2000 locked
        },
        canonicalProtocol: {
          lido: {
            canonicalProtocolName: 'lido',
            protocolIds: ['lido'],
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
          vesting: {
            canonicalProtocolName: 'vesting',
            protocolIds: ['vesting'],
            totals: {
              netTotal: '0',
              totalDeposits: '0',
              totalBorrows: '0',
              totalRewards: '0',
              totalLocked: '2000',
              overallTotal: '2000',
            },
            totalsByChain: {},
          },
        },
      }
    );

    const transformedData = transformPositions(mockResponse, FIXTURE_PARAMS);

    // Grand total should be adjusted: 10000 - 3000 (filtered) = 7000
    expect(transformedData.totals.total.amount).toBe('7000');
    expect(transformedData.totals.totalLocked.amount).toBe('2000');

    // Store and get balance
    const queryKey = `${FIXTURE_PARAMS.address}-${FIXTURE_PARAMS.currency}`;
    const store = usePositionsStore.getState();
    store.queryCache[queryKey] = {
      data: transformedData,
      lastFetchedAt: Date.now(),
      cacheTime: 0,
      errorInfo: null,
    };
    usePositionsStore.setState({ queryKey });

    const walletBalance = usePositionsStore.getState().getBalance();

    // Wallet balance: 7000 (adjusted total) - 2000 (locked) = 5000
    expect(walletBalance).toBe('5000');
  });

  it('should handle mixed position with both filtered and non-filtered items', () => {
    // Lido position with both wstETH (filtered) and regular staking (not filtered)
    // Note: In reality, this would require multiple portfolio items in one position
    // For this test, we create two separate positions under same protocol
    const mockResponse = createMockResponse(
      [
        // Lido wstETH (filtered)
        createMockPosition({
          id: 'lido:1',
          protocolName: 'Lido',
          canonicalProtocolName: 'lido',
          protocolVersion: 'v1',
          positionName: PositionName.STAKED,
          detailType: DetailType.COMMON,
          assetValue: '2000',
          debtValue: '0',
          netValue: '2000',
          description: 'wstETH',
          tokens: {
            supplyTokenList: [{ amount: '1', asset: createMockAsset('wstETH', 2000), assetValue: '2000' }],
          },
        }),
        // Lido regular staking (not filtered)
        createMockPosition({
          id: 'lido:2',
          protocolName: 'Lido',
          canonicalProtocolName: 'lido',
          protocolVersion: 'v1',
          positionName: PositionName.STAKED,
          detailType: DetailType.COMMON,
          assetValue: '3000',
          debtValue: '0',
          netValue: '3000',
          tokens: {
            supplyTokenList: [{ amount: '3000', asset: createMockAsset('LDO', 1), assetValue: '3000' }],
          },
        }),
      ],
      {
        totals: {
          netTotal: '5000', // Backend total including both
          totalDeposits: '5000',
          totalBorrows: '0',
          totalRewards: '0',
          totalLocked: '0',
          overallTotal: '5000',
        },
        canonicalProtocol: {
          lido: {
            canonicalProtocolName: 'lido',
            protocolIds: ['lido'],
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
      }
    );

    const transformedData = transformPositions(mockResponse, FIXTURE_PARAMS);

    // Grand total adjusted: 5000 - 2000 (wstETH) = 3000
    expect(transformedData.totals.total.amount).toBe('3000');

    // Lido position should still exist (has non-filtered item)
    expect(transformedData.positions['lido']).toBeDefined();

    // Lido position total adjusted: 5000 - 2000 = 3000
    expect(transformedData.positions['lido'].totals.total.amount).toBe('3000');

    // Store and get balance
    const queryKey = `${FIXTURE_PARAMS.address}-${FIXTURE_PARAMS.currency}`;
    const store = usePositionsStore.getState();
    store.queryCache[queryKey] = {
      data: transformedData,
      lastFetchedAt: Date.now(),
      cacheTime: 0,
      errorInfo: null,
    };
    usePositionsStore.setState({ queryKey });

    const walletBalance = usePositionsStore.getState().getBalance();

    // Wallet balance should be 3000
    expect(walletBalance).toBe('3000');
  });
});
