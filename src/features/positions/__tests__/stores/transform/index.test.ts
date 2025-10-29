import { transformPositions } from '../../../stores/transform';
import { LIST_POSITIONS_SUCCESS, LIST_POSITIONS_SUCCESS_EMPTY, TEST_PARAMS } from '../../../__fixtures__/ListPositions';
import { PositionName, DetailType, type ListPositionsResponse } from '../../../types/generated/positions/positions';
import {
  getFilteredItemsFromPosition,
  getAllFilteredItems,
  calculateFilteredValue,
  getBackendProtocolTotal,
  getBackendGrandTotal,
  getPositionsWithFilteredItems,
  getPositionsWithoutFilteredItems,
} from '../../../helpers/filters';
import { createMockAsset } from '../../mocks/assets';
import { createSimpleDapp } from '../../mocks/positions';

jest.mock('@/config', () => ({
  getExperimentalFlag: jest.fn(() => true),
  DEFI_POSITIONS_THRESHOLD_FILTER: 'defi_positions_threshold_filter',
}));

describe('transformPositions', () => {
  const defaultParams = TEST_PARAMS;

  describe('Basic Functionality', () => {
    it('should transform positions successfully', () => {
      const result = transformPositions(LIST_POSITIONS_SUCCESS, defaultParams);

      // Check that we have transformed positions
      expect(result).toBeDefined();
      expect(result.positions).toBeDefined();
      expect(Object.keys(result.positions).length).toBeGreaterThan(0);
      expect(result.totals).toBeDefined();
      expect(result.totals.total).toBeDefined();
    });

    it('should pass currency to parser', () => {
      const paramsWithEUR = {
        ...defaultParams,
        currency: 'EUR' as const,
      };

      const result = transformPositions(LIST_POSITIONS_SUCCESS, paramsWithEUR);

      // Should still transform successfully with different currency
      expect(result).toBeDefined();
      expect(result.positions).toBeDefined();
    });

    it('should transform real fixture data correctly', () => {
      const result = transformPositions(LIST_POSITIONS_SUCCESS, defaultParams);

      // Check that we have protocol positions
      const protocolNames = Object.keys(result.positions);
      expect(protocolNames.length).toBeGreaterThan(0);

      // Check first position has expected structure
      const firstProtocol = protocolNames[0];
      const firstPosition = result.positions[firstProtocol];
      expect(firstPosition).toHaveProperty('type');
      expect(firstPosition).toHaveProperty('totals');
      expect(firstPosition).toHaveProperty('deposits');
      expect(firstPosition).toHaveProperty('pools');
      expect(firstPosition).toHaveProperty('stakes');
      expect(firstPosition).toHaveProperty('borrows');
      expect(firstPosition).toHaveProperty('rewards');
      expect(firstPosition).toHaveProperty('dapp');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty response', () => {
      const result = transformPositions(LIST_POSITIONS_SUCCESS_EMPTY, defaultParams);

      // Should return empty structure for empty response
      expect(result).toBeDefined();
      expect(Object.keys(result.positions).length).toBe(0);
      expect(result.totals.total.amount).toBe('0');
    });

    it('should handle response with errors', () => {
      const responseWithErrors: ListPositionsResponse = {
        ...LIST_POSITIONS_SUCCESS,
        errors: ['Chain 10 failed', 'Chain 42161 failed'],
      };

      const result = transformPositions(responseWithErrors, defaultParams);

      // Should still transform positions despite errors
      expect(result).toBeDefined();
      expect(result.positions).toBeDefined();
      expect(Object.keys(result.positions).length).toBeGreaterThan(0);
    });

    it('should handle malformed response gracefully', () => {
      const malformedResponse: ListPositionsResponse = {
        result: undefined,
        metadata: undefined,
        errors: ['Failed to fetch'],
      };

      const result = transformPositions(malformedResponse, defaultParams);

      // Should return empty structure for malformed response
      expect(result).toBeDefined();
      expect(Object.keys(result.positions).length).toBe(0);
    });

    it('should handle response with no result field', () => {
      const responseNoResult: ListPositionsResponse = {
        result: undefined,
        metadata: undefined,
        errors: [],
      };

      const result = transformPositions(responseNoResult, defaultParams);

      // Should return empty structure
      expect(result).toBeDefined();
      expect(Object.keys(result.positions).length).toBe(0);
    });

    it('should handle response with null positions', () => {
      const responseNullPositions = {
        result: {
          positions: null,
        },
        metadata: undefined,
        errors: [],
      } as unknown as ListPositionsResponse;

      const result = transformPositions(responseNullPositions, defaultParams);

      // Should return empty structure
      expect(result).toBeDefined();
      expect(Object.keys(result.positions).length).toBe(0);
    });
  });

  describe('Full Fixture Test', () => {
    const result = transformPositions(LIST_POSITIONS_SUCCESS, TEST_PARAMS);

    describe('Overall Structure', () => {
      it('should return valid RainbowPositions structure', () => {
        expect(result).toBeDefined();
        expect(result).toHaveProperty('positions');
        expect(result).toHaveProperty('totals');
      });

      it('should have correct totals structure', () => {
        const { totals } = result;
        expect(totals).toHaveProperty('total');
        expect(totals).toHaveProperty('totalDeposits');
        expect(totals).toHaveProperty('totalBorrows');
        expect(totals).toHaveProperty('totalRewards');

        // Each total should have amount and display
        expect(totals.total).toHaveProperty('amount');
        expect(totals.total).toHaveProperty('display');
        expect(totals.totalDeposits).toHaveProperty('amount');
        expect(totals.totalDeposits).toHaveProperty('display');
        expect(totals.totalBorrows).toHaveProperty('amount');
        expect(totals.totalBorrows).toHaveProperty('display');
        expect(totals.totalRewards).toHaveProperty('amount');
        expect(totals.totalRewards).toHaveProperty('display');
      });

      it('should have non-zero totals', () => {
        const { totals } = result;
        expect(parseFloat(totals.total.amount)).toBeGreaterThan(0);
        expect(parseFloat(totals.totalDeposits.amount)).toBeGreaterThan(0);
      });
    });

    describe('Protocol Positions', () => {
      it('should have transformed multiple protocols', () => {
        const protocolCount = Object.keys(result.positions).length;
        expect(protocolCount).toBeGreaterThan(10); // Fixture has many protocols
      });

      it('should contain expected major protocols', () => {
        const protocolNames = Object.keys(result.positions);
        const expectedProtocols = ['aave', 'compound', 'curve', 'uniswap', 'balancer'];

        expectedProtocols.forEach(protocol => {
          const found = protocolNames.some(name => name.toLowerCase().includes(protocol));
          expect(found).toBe(true);
        });
      });

      it('should have positions sorted by value (descending)', () => {
        const positions = Object.values(result.positions);
        for (let i = 1; i < positions.length; i++) {
          const prevValue = parseFloat(positions[i - 1].totals.total.amount);
          const currValue = parseFloat(positions[i].totals.total.amount);
          expect(prevValue).toBeGreaterThanOrEqual(currValue);
        }
      });

      it('should filter out positions with value less than $1', () => {
        const positions = Object.values(result.positions);
        positions.forEach(position => {
          const totalValue = parseFloat(position.totals.total.amount);
          expect(totalValue).toBeGreaterThanOrEqual(1);
        });
      });
    });

    describe('Individual Position Structure', () => {
      const [firstProtocolName] = Object.keys(result.positions);
      const firstPosition = result.positions[firstProtocolName];

      it('should have all required position properties', () => {
        expect(firstPosition).toHaveProperty('type');
        expect(firstPosition).toHaveProperty('protocolVersion');
        expect(firstPosition).toHaveProperty('deposits');
        expect(firstPosition).toHaveProperty('pools');
        expect(firstPosition).toHaveProperty('stakes');
        expect(firstPosition).toHaveProperty('borrows');
        expect(firstPosition).toHaveProperty('rewards');
        expect(firstPosition).toHaveProperty('totals');
        expect(firstPosition).toHaveProperty('dapp');
      });

      it('should have valid dapp metadata', () => {
        const { dapp } = firstPosition;
        expect(dapp).toHaveProperty('name');
        expect(dapp).toHaveProperty('url');
        expect(dapp).toHaveProperty('icon_url');
        expect(dapp).toHaveProperty('colors');
        expect(dapp.colors).toHaveProperty('primary');
        expect(dapp.colors).toHaveProperty('fallback');
        // shadow is optional, but if present should be a string
        expect(dapp.colors.shadow === undefined || typeof dapp.colors.shadow === 'string').toBe(true);
      });

      it('should have totals from backend stats', () => {
        const { totals } = firstPosition;

        // Verify totals structure (values come from backend stats)
        expect(totals).toHaveProperty('total');
        expect(totals).toHaveProperty('totalDeposits');
        expect(totals).toHaveProperty('totalBorrows');
        expect(totals).toHaveProperty('totalRewards');
        expect(totals).toHaveProperty('totalLocked');

        // Verify each total has amount and display
        expect(totals.total).toHaveProperty('amount');
        expect(totals.total).toHaveProperty('display');
        expect(typeof totals.total.amount).toBe('string');
        expect(typeof totals.total.display).toBe('string');
      });
    });

    describe('Position Items Processing', () => {
      const positions = Object.values(result.positions);

      it('should have transformed deposits correctly', () => {
        const positionsWithDeposits = positions.filter(p => p.deposits.length > 0);
        expect(positionsWithDeposits.length).toBeGreaterThan(0);

        const firstDeposit = positionsWithDeposits[0].deposits[0];
        expect(firstDeposit).toHaveProperty('asset');
        expect(firstDeposit).toHaveProperty('quantity');
        expect(firstDeposit).toHaveProperty('value');
        expect(firstDeposit).toHaveProperty('underlying');
      });

      it('should have transformed LP pools correctly', () => {
        const positionsWithPools = positions.filter(p => p.pools.length > 0);
        expect(positionsWithPools.length).toBeGreaterThan(0);

        const firstPool = positionsWithPools[0].pools[0];
        expect(firstPool).toHaveProperty('asset');
        expect(firstPool).toHaveProperty('quantity');
        expect(firstPool).toHaveProperty('value');
        expect(firstPool).toHaveProperty('underlying');
        expect(firstPool).toHaveProperty('isConcentratedLiquidity');
        expect(firstPool).toHaveProperty('rangeStatus');
        expect(firstPool).toHaveProperty('allocation');
        expect(Array.isArray(firstPool.underlying)).toBe(true);
      });

      it('should have transformed stakes correctly', () => {
        const positionsWithStakes = positions.filter(p => p.stakes.length > 0);
        expect(positionsWithStakes.length).toBeGreaterThan(0);

        const firstStake = positionsWithStakes[0].stakes[0];
        expect(firstStake).toHaveProperty('asset');
        expect(firstStake).toHaveProperty('quantity');
        expect(firstStake).toHaveProperty('value');
        expect(firstStake).toHaveProperty('underlying');
        expect(firstStake).toHaveProperty('isLp');
      });

      it('should have LP-specific fields for LP stakes', () => {
        const positionsWithStakes = positions.filter(p => p.stakes.length > 0);

        // Skip test if no stakes in test data
        if (positionsWithStakes.length === 0) return;

        const lpStakes = positionsWithStakes.flatMap(p => p.stakes).filter(s => s.isLp);

        // Skip test if no LP stakes in test data
        if (lpStakes.length === 0) return;

        const firstLpStake = lpStakes[0];
        expect(firstLpStake).toHaveProperty('isConcentratedLiquidity');
        expect(firstLpStake).toHaveProperty('rangeStatus');
        expect(firstLpStake).toHaveProperty('allocation');
      });

      it('should have transformed borrows correctly', () => {
        const positionsWithBorrows = positions.filter(p => p.borrows.length > 0);

        // Skip test if no borrows in test data
        if (positionsWithBorrows.length === 0) return;

        const firstBorrow = positionsWithBorrows[0].borrows[0];
        expect(firstBorrow).toHaveProperty('asset');
        expect(firstBorrow).toHaveProperty('quantity');
        expect(firstBorrow).toHaveProperty('value');
        expect(firstBorrow).toHaveProperty('underlying');
      });

      it('should have transformed rewards correctly', () => {
        const positionsWithRewards = positions.filter(p => p.rewards.length > 0);

        // Skip test if no rewards in test data
        if (positionsWithRewards.length === 0) return;

        const firstReward = positionsWithRewards[0].rewards[0];
        expect(firstReward).toHaveProperty('asset');
        expect(firstReward).toHaveProperty('quantity');
        expect(firstReward).toHaveProperty('value');
        expect(firstReward).toHaveProperty('value');
        expect(firstReward.value).toHaveProperty('amount');
        expect(firstReward.value).toHaveProperty('display');
      });

      it('should sort items within positions by value', () => {
        positions.forEach(position => {
          // Check deposits are sorted
          for (let i = 1; i < position.deposits.length; i++) {
            const prevValue = parseFloat(position.deposits[i - 1].value.amount);
            const currValue = parseFloat(position.deposits[i].value.amount);
            expect(prevValue).toBeGreaterThanOrEqual(currValue);
          }

          // Check pools are sorted
          for (let i = 1; i < position.pools.length; i++) {
            const prevValue = parseFloat(position.pools[i - 1].value.amount);
            const currValue = parseFloat(position.pools[i].value.amount);
            expect(prevValue).toBeGreaterThanOrEqual(currValue);
          }

          // Check stakes are sorted
          for (let i = 1; i < position.stakes.length; i++) {
            const prevValue = parseFloat(position.stakes[i - 1].value.amount);
            const currValue = parseFloat(position.stakes[i].value.amount);
            expect(prevValue).toBeGreaterThanOrEqual(currValue);
          }

          // Check borrows are sorted
          for (let i = 1; i < position.borrows.length; i++) {
            const prevValue = parseFloat(position.borrows[i - 1].value.amount);
            const currValue = parseFloat(position.borrows[i].value.amount);
            expect(prevValue).toBeGreaterThanOrEqual(currValue);
          }

          // Check rewards are sorted
          for (let i = 1; i < position.rewards.length; i++) {
            const prevValue = parseFloat(position.rewards[i - 1].value.amount);
            const currValue = parseFloat(position.rewards[i].value.amount);
            expect(prevValue).toBeGreaterThanOrEqual(currValue);
          }
        });
      });
    });

    describe('Underlying Assets', () => {
      const positions = Object.values(result.positions);

      it('should have transformed underlying assets with correct structure', () => {
        const positionWithUnderlying = positions.find(
          p => p.deposits.some(d => d.underlying && d.underlying.length > 0) || p.pools.some(d => d.underlying && d.underlying.length > 0)
        );

        expect(positionWithUnderlying).toBeDefined();

        const itemWithUnderlying =
          positionWithUnderlying?.deposits.find(d => d.underlying?.length > 0) ||
          positionWithUnderlying?.pools.find(d => d.underlying?.length > 0);

        expect(itemWithUnderlying).toBeDefined();

        const underlying = itemWithUnderlying?.underlying[0];
        expect(underlying).toHaveProperty('asset');
        expect(underlying).toHaveProperty('quantity');
        expect(underlying).toHaveProperty('value');

        // Check asset structure
        expect(underlying?.asset).toHaveProperty('icon_url');
        expect(underlying?.asset).toHaveProperty('chainId');
        expect(underlying?.asset).toHaveProperty('symbol');
        expect(underlying?.asset).toHaveProperty('name');

        // Check native display
        expect(underlying?.value).toHaveProperty('amount');
        expect(underlying?.value).toHaveProperty('display');
      });

      it('should calculate LP pool allocations correctly', () => {
        const positionsWithPools = positions.filter(p => p.pools.length > 0);

        positionsWithPools.forEach(position => {
          position.pools.forEach(pool => {
            // Skip if no allocation
            if (!pool.allocation) return;

            // Allocation should be in format like "50/50" or "100/0"
            expect(pool.allocation).toMatch(/^\d+(?:\/\d+)*$/);

            // Sum of allocations should equal 100
            const allocations = pool.allocation.split('/').map(Number);
            const sum = allocations.reduce((a, b) => a + b, 0);
            expect(sum).toBe(100);
          });
        });
      });

      it('transformDeposits: uses token.value, not stats.assetValue', () => {
        const res = transformPositions(
          {
            result: {
              positions: [
                {
                  id: 't:1',
                  chainId: 1,
                  protocolName: 'T',
                  canonicalProtocolName: 't',
                  protocolVersion: 'v1',
                  tvl: '0',
                  dapp: createSimpleDapp('T'),
                  portfolioItems: [
                    {
                      name: PositionName.LENDING,
                      stats: { assetValue: '2000', debtValue: '0', netValue: '2000' },
                      updateTime: undefined,
                      detailTypes: [DetailType.LENDING],
                      pool: undefined,
                      assetDict: {},
                      detail: {
                        supplyTokenList: [
                          { amount: '1', asset: createMockAsset('A', 1), assetValue: '1200' },
                          { amount: '800', asset: createMockAsset('B', 1), assetValue: '800' },
                        ],
                        borrowTokenList: [],
                        rewardTokenList: [],
                        tokenList: [],
                      },
                    },
                  ],
                },
              ],
              stats: {
                totals: {
                  netTotal: '2000',
                  totalDeposits: '2000',
                  totalBorrows: '0',
                  totalRewards: '0',
                  totalLocked: '0',
                  overallTotal: '2000',
                },
                canonicalProtocol: {
                  t: {
                    canonicalProtocolName: 't',
                    protocolIds: ['t'],
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
              },
            },
            errors: [],
            metadata: undefined,
          },
          TEST_PARAMS
        );
        expect(res.positions['t'].deposits[0].value.amount).toBe('1200');
        expect(res.positions['t'].deposits[1].value.amount).toBe('800');
      });

      it('transformBorrows: uses token.value, not stats.debtValue', () => {
        const res = transformPositions(
          {
            result: {
              positions: [
                {
                  id: 't:1',
                  chainId: 1,
                  protocolName: 'T',
                  canonicalProtocolName: 't',
                  protocolVersion: 'v1',
                  tvl: '0',
                  dapp: createSimpleDapp('T'),
                  portfolioItems: [
                    {
                      name: PositionName.LENDING,
                      stats: { assetValue: '5000', debtValue: '1500', netValue: '3500' },
                      updateTime: undefined,
                      detailTypes: [DetailType.LENDING],
                      pool: undefined,
                      assetDict: {},
                      detail: {
                        supplyTokenList: [{ amount: '5000', asset: createMockAsset('C', 1), assetValue: '5000' }],
                        borrowTokenList: [
                          { amount: '900', asset: createMockAsset('D', 1), assetValue: '900' },
                          { amount: '600', asset: createMockAsset('E', 1), assetValue: '600' },
                        ],
                        rewardTokenList: [],
                        tokenList: [],
                      },
                    },
                  ],
                },
              ],
              stats: {
                totals: {
                  netTotal: '3500',
                  totalDeposits: '5000',
                  totalBorrows: '1500',
                  totalRewards: '0',
                  totalLocked: '0',
                  overallTotal: '3500',
                },
                canonicalProtocol: {
                  t: {
                    canonicalProtocolName: 't',
                    protocolIds: ['t'],
                    totals: {
                      netTotal: '3500',
                      totalDeposits: '5000',
                      totalBorrows: '1500',
                      totalRewards: '0',
                      totalLocked: '0',
                      overallTotal: '3500',
                    },
                    totalsByChain: {},
                  },
                },
              },
            },
            errors: [],
            metadata: undefined,
          },
          TEST_PARAMS
        );
        expect(res.positions['t'].borrows[0].value.amount).toBe('900');
        expect(res.positions['t'].borrows[1].value.amount).toBe('600');
      });

      it('transformStakes: uses token.value, not stats.assetValue', () => {
        const res = transformPositions(
          {
            result: {
              positions: [
                {
                  id: 't:1',
                  chainId: 1,
                  protocolName: 'T',
                  canonicalProtocolName: 't',
                  protocolVersion: 'v1',
                  tvl: '0',
                  dapp: createSimpleDapp('T'),
                  portfolioItems: [
                    {
                      name: PositionName.LEVERAGED_FARMING,
                      stats: { assetValue: '1000', debtValue: '0', netValue: '1000' },
                      updateTime: undefined,
                      detailTypes: [DetailType.LEVERAGED_FARMING],
                      pool: undefined,
                      assetDict: {},
                      detail: {
                        supplyTokenList: [{ amount: '0.5', asset: createMockAsset('F', 1), assetValue: '1000' }],
                        borrowTokenList: [],
                        rewardTokenList: [],
                        tokenList: [],
                      },
                    },
                  ],
                },
              ],
              stats: {
                totals: {
                  netTotal: '1000',
                  totalDeposits: '0',
                  totalBorrows: '0',
                  totalRewards: '0',
                  totalLocked: '1000',
                  overallTotal: '1000',
                },
                canonicalProtocol: {
                  t: {
                    canonicalProtocolName: 't',
                    protocolIds: ['t'],
                    totals: {
                      netTotal: '1000',
                      totalDeposits: '0',
                      totalBorrows: '0',
                      totalRewards: '0',
                      totalLocked: '1000',
                      overallTotal: '1000',
                    },
                    totalsByChain: {},
                  },
                },
              },
            },
            errors: [],
            metadata: undefined,
          },
          TEST_PARAMS
        );
        expect(res.positions['t'].stakes[0].value.amount).toBe('1000');
      });

      it('transformPools: uses stats.assetValue for pool, individual values for underlying', () => {
        const res = transformPositions(
          {
            result: {
              positions: [
                {
                  id: 't:1',
                  chainId: 1,
                  protocolName: 'T',
                  canonicalProtocolName: 't',
                  protocolVersion: 'v1',
                  tvl: '0',
                  dapp: createSimpleDapp('T'),
                  portfolioItems: [
                    {
                      name: PositionName.LIQUIDITY_POOL,
                      stats: { assetValue: '3000', debtValue: '0', netValue: '3000' },
                      updateTime: undefined,
                      detailTypes: [DetailType.COMMON],
                      pool: undefined,
                      assetDict: {},
                      detail: {
                        supplyTokenList: [
                          { amount: '1', asset: createMockAsset('G', 1), assetValue: '1800' },
                          { amount: '1200', asset: createMockAsset('H', 1), assetValue: '1200' },
                        ],
                        borrowTokenList: [],
                        rewardTokenList: [],
                        tokenList: [],
                      },
                    },
                  ],
                },
              ],
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
                  t: {
                    canonicalProtocolName: 't',
                    protocolIds: ['t'],
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
            },
            errors: [],
            metadata: undefined,
          },
          TEST_PARAMS
        );
        const pool = res.positions['t'].pools[0];
        expect(pool.value.amount).toBe('3000');
        expect(pool.underlying[0].value.amount).toBe('1800');
        expect(pool.underlying[1].value.amount).toBe('1200');
      });

      it('transformLpStakes: uses stats.assetValue for stake, individual values for underlying', () => {
        const res = transformPositions(
          {
            result: {
              positions: [
                {
                  id: 't:1',
                  chainId: 1,
                  protocolName: 'T',
                  canonicalProtocolName: 't',
                  protocolVersion: 'v1',
                  tvl: '0',
                  dapp: createSimpleDapp('T'),
                  portfolioItems: [
                    {
                      name: PositionName.LEVERAGED_FARMING,
                      stats: { assetValue: '4500', debtValue: '0', netValue: '4500' },
                      updateTime: undefined,
                      detailTypes: [DetailType.LEVERAGED_FARMING],
                      pool: undefined,
                      assetDict: {},
                      detail: {
                        supplyTokenList: [
                          { amount: '2', asset: createMockAsset('I', 1), assetValue: '2700' },
                          { amount: '1800', asset: createMockAsset('J', 1), assetValue: '1800' },
                        ],
                        borrowTokenList: [],
                        rewardTokenList: [],
                        tokenList: [],
                      },
                    },
                  ],
                },
              ],
              stats: {
                totals: {
                  netTotal: '4500',
                  totalDeposits: '0',
                  totalBorrows: '0',
                  totalRewards: '0',
                  totalLocked: '4500',
                  overallTotal: '4500',
                },
                canonicalProtocol: {
                  t: {
                    canonicalProtocolName: 't',
                    protocolIds: ['t'],
                    totals: {
                      netTotal: '4500',
                      totalDeposits: '0',
                      totalBorrows: '0',
                      totalRewards: '0',
                      totalLocked: '4500',
                      overallTotal: '4500',
                    },
                    totalsByChain: {},
                  },
                },
              },
            },
            errors: [],
            metadata: undefined,
          },
          TEST_PARAMS
        );
        const stake = res.positions['t'].stakes[0];
        expect(stake.value.amount).toBe('4500');
        expect(stake.underlying[0].value.amount).toBe('2700');
        expect(stake.underlying[1].value.amount).toBe('1800');
      });
    });

    describe('Grand Totals from Backend Stats', () => {
      it('should have grand totals structure from backend', () => {
        // Grand totals come from backend stats, not calculated from item sums
        expect(result.totals).toHaveProperty('total');
        expect(result.totals).toHaveProperty('totalDeposits');
        expect(result.totals).toHaveProperty('totalBorrows');
        expect(result.totals).toHaveProperty('totalRewards');
        expect(result.totals).toHaveProperty('totalLocked');

        // Verify all totals have amount and display
        expect(result.totals.total).toHaveProperty('amount');
        expect(result.totals.total).toHaveProperty('display');
        expect(typeof result.totals.total.amount).toBe('string');
        expect(typeof result.totals.total.display).toBe('string');

        // Verify totals are reasonable positive numbers
        const totalValue = parseFloat(result.totals.total.amount);
        expect(totalValue).toBeGreaterThan(0);
      });
    });

    describe('Position Type Mapping', () => {
      it('should handle all position types from fixture', () => {
        const rawPositions = LIST_POSITIONS_SUCCESS.result?.positions ?? [];
        const allPortfolioItems = rawPositions.flatMap(p => p.portfolioItems);

        const positionTypes = [
          PositionName.DEPOSIT,
          PositionName.FARMING,
          PositionName.INVESTMENT,
          PositionName.LENDING,
          PositionName.LIQUIDITY_POOL,
          PositionName.LOCKED,
          PositionName.STAKED,
          PositionName.YIELD,
        ];

        positionTypes.forEach(type => {
          const itemsOfType = allPortfolioItems.filter(item => item.name === type);

          // Skip if no items of this type in test data
          if (itemsOfType.length === 0) return;

          // Verify that positions of this type were processed
          const positions = Object.values(result.positions);
          const hasProcessedType = positions.some(position => {
            switch (type) {
              case PositionName.DEPOSIT:
              case PositionName.INVESTMENT:
                return position.deposits.length > 0;
              case PositionName.LIQUIDITY_POOL:
              case PositionName.FARMING:
                return position.pools.length > 0 || position.stakes.length > 0;
              case PositionName.STAKED:
              case PositionName.LOCKED:
                return position.stakes.length > 0;
              case PositionName.LENDING:
              case PositionName.YIELD:
                return position.deposits.length > 0 || position.borrows.length > 0;
              default:
                return false;
            }
          });
          expect(hasProcessedType).toBe(true);
        });
      });
    });

    describe('Currency Formatting', () => {
      it('should format USD values with correct display strings', () => {
        const { totals } = result;

        // USD display should have $ symbol and comma separators
        expect(totals.total.display).toMatch(/^\$[\d,]+(\.\d{2})?$/);
        expect(totals.totalDeposits.display).toMatch(/^\$[\d,]+(\.\d{2})?$/);

        // Individual position values should also be formatted
        const firstPosition = Object.values(result.positions)[0];
        expect(firstPosition.totals.total.display).toMatch(/^\$[\d,]+(\.\d{2})?$/);
      });
    });

    describe('Wallet-Only Position Filtering', () => {
      it('should filter wstETH positions by description', () => {
        // The fixture contains a Lido wstETH staking position with description "wstETH"
        // This should be filtered out (treated as wallet-only)

        const lidoPosition = result.positions['lido'];

        // Lido position might be filtered entirely or have filtered items
        if (lidoPosition) {
          // Check that no stakes have wstETH in their name/description
          const wstethStakes = lidoPosition.stakes.filter(stake => 'name' in stake && stake.name === 'wstETH');
          // eslint-disable-next-line jest/no-conditional-expect
          expect(wstethStakes.length).toBe(0);
        }

        // Alternatively, check raw fixture to verify filtering happened
        const rawLidoPositions = LIST_POSITIONS_SUCCESS.result?.positions?.filter(p => p.protocolName?.toLowerCase() === 'lido');

        if (rawLidoPositions && rawLidoPositions.length > 0) {
          const rawWstethItems = rawLidoPositions.flatMap(
            p => p.portfolioItems?.filter(item => item.detail?.description === 'wstETH') || []
          );

          // Raw fixture should have wstETH items
          // eslint-disable-next-line jest/no-conditional-expect
          expect(rawWstethItems.length).toBeGreaterThan(0);

          // But they should be filtered from final result
          // (Lido position either doesn't exist or doesn't have those items)
          if (lidoPosition) {
            const totalLidoItems =
              lidoPosition.deposits.length +
              lidoPosition.pools.length +
              lidoPosition.stakes.length +
              lidoPosition.borrows.length +
              lidoPosition.rewards.length;

            const rawLidoItemCount = rawLidoPositions.flatMap(p => p.portfolioItems || []).length;

            // Filtered items should be fewer than raw items
            // eslint-disable-next-line jest/no-conditional-expect
            expect(totalLidoItems).toBeLessThan(rawLidoItemCount);
          }
        }
      });

      it('should filter stETH positions by description if present', () => {
        // This documents the behavior for stETH positions identified by description
        // (Note: stETH in Curve pools appears as asset.symbol, not description)

        const positions = Object.values(result.positions);
        const allStakes = positions.flatMap(p => p.stakes);

        // No stakes should have stETH as their name (if it came from description)
        const stethStakes = allStakes.filter(stake => 'name' in stake && stake.name === 'stETH');
        expect(stethStakes.length).toBe(0);
      });
    });

    describe('Filtered Values Total Adjustment', () => {
      it('should subtract filtered item values from position totals', () => {
        // Find Lido positions that have filtered items (e.g., wstETH)
        const rawLidoPositions = LIST_POSITIONS_SUCCESS.result?.positions?.filter(p => p.protocolName?.toLowerCase() === 'lido');

        if (rawLidoPositions && rawLidoPositions.length > 0) {
          const filteredItems = rawLidoPositions.flatMap(getFilteredItemsFromPosition);

          if (filteredItems.length > 0) {
            const filteredValue = calculateFilteredValue(filteredItems);
            const backendTotal = getBackendProtocolTotal(LIST_POSITIONS_SUCCESS, 'lido');
            const expectedTotal = backendTotal - filteredValue;

            const lidoPosition = result.positions['lido'];
            if (lidoPosition) {
              const transformedTotal = parseFloat(lidoPosition.totals.total.amount);

              // eslint-disable-next-line jest/no-conditional-expect
              expect(transformedTotal).toBeCloseTo(expectedTotal, 2);
              // eslint-disable-next-line jest/no-conditional-expect
              expect(filteredValue).toBeGreaterThan(0);
            }
          }
        }
      });

      it('should subtract filtered item values from grand totals', () => {
        const allFilteredItems = getAllFilteredItems(LIST_POSITIONS_SUCCESS);

        // Verify fixture has filtered items
        expect(allFilteredItems.length).toBeGreaterThan(0);

        const totalFilteredValue = calculateFilteredValue(allFilteredItems);
        const backendGrandTotal = getBackendGrandTotal(LIST_POSITIONS_SUCCESS);
        const expectedGrandTotal = backendGrandTotal - totalFilteredValue;

        const transformedGrandTotal = parseFloat(result.totals.total.amount);

        expect(transformedGrandTotal).toBeCloseTo(expectedGrandTotal, 2);
        expect(totalFilteredValue).toBeGreaterThan(0);
      });

      it('should handle multiple filtered items across positions', () => {
        const positionsWithFilteredItems = getPositionsWithFilteredItems(LIST_POSITIONS_SUCCESS);

        positionsWithFilteredItems.forEach(({ protocol, filteredItems }) => {
          const filteredValue = calculateFilteredValue(filteredItems);
          const backendTotal = getBackendProtocolTotal(LIST_POSITIONS_SUCCESS, protocol);
          const expectedTotal = backendTotal - filteredValue;

          const transformedPosition = result.positions[protocol];

          if (transformedPosition) {
            const transformedTotal = parseFloat(transformedPosition.totals.total.amount);
            // eslint-disable-next-line jest/no-conditional-expect
            expect(transformedTotal).toBeCloseTo(expectedTotal, 2);
          }
        });
      });

      it('should not affect totals when no items are filtered', () => {
        const positionsWithoutFilteredItems = getPositionsWithoutFilteredItems(LIST_POSITIONS_SUCCESS).slice(0, 1);

        positionsWithoutFilteredItems.forEach(p => {
          const backendTotal = getBackendProtocolTotal(LIST_POSITIONS_SUCCESS, p.canonicalProtocolName);
          const transformedPosition = result.positions[p.canonicalProtocolName];

          if (transformedPosition && backendTotal > 0) {
            const transformedTotal = parseFloat(transformedPosition.totals.total.amount);
            // eslint-disable-next-line jest/no-conditional-expect
            expect(transformedTotal).toBeCloseTo(backendTotal, 2);
          }
        });
      });
    });
  });
});
