/**
 * Tests for categories.ts parser
 * References debank-positions-tdd.md Section 4.5.2 for category mapping logic
 */

import { processPortfolioItem } from '../../parsers/categories';
import { PositionName, type PortfolioItem, type Position, type RainbowPosition } from '../../types';
import type { Asset } from '../../types/generated/common/asset';
import { TEST_PARAMS } from '../../__fixtures__/ListPositions';

// Helper to create a valid Asset object for tests
function createMockAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 1,
    name: 'Test Token',
    symbol: 'TEST',
    decimals: 18,
    type: 'erc20',
    iconUrl: 'https://test.logo',
    network: 'ethereum',
    mainnetAddress: '0x0000000000000000000000000000000000000000',
    verified: true,
    transferable: true,
    creationDate: '2024-01-01T00:00:00Z',
    colors: {
      primary: '#000000',
      fallback: '#ffffff',
    },
    price: {
      value: 1,
      changedAt: undefined,
      relativeChange24h: 0,
    },
    networks: {},
    bridging: undefined,
    ...overrides,
  } as Asset;
}

// Mock dependencies
jest.mock('@/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Categories Parser', () => {
  const createMockPosition = (): Position => ({
    id: 'test:1',
    protocolName: 'Test Protocol',
    canonicalProtocolName: 'test',
    protocolVersion: 'v1',
    chainId: 1,
    tvl: '0',
    portfolioItems: [],
    dapp: {
      name: 'Test Protocol',
      url: 'https://test.com',
      iconUrl: 'https://logo.url',
      colors: {
        primary: '#000000',
        fallback: '#000000',
        shadow: '#000000',
      },
    },
  });

  const createRainbowPosition = (): RainbowPosition => ({
    type: 'test',
    deposits: [],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
    chainIds: [1],
    totals: {
      totals: { amount: '0', display: '$0' },
      totalDeposits: { amount: '0', display: '$0' },
      totalBorrows: { amount: '0', display: '$0' },
      totalRewards: { amount: '0', display: '$0' },
      totalLocked: '0',
    },
    dapp: {
      name: 'Test Protocol',
      url: 'https://test.com',
      icon_url: 'https://logo.url',
      colors: {
        primary: '#000000',
        fallback: '#000000',
        shadow: '#000000',
      },
    },
  });

  // Test: Lending positions mapping (TDD Section 4.4.2 - Deposits category)
  it('should map LENDING positions to deposits category', () => {
    const item: PortfolioItem = {
      name: PositionName.YIELD,
      updateTime: new Date(),
      detailTypes: [],
      pool: undefined,
      assetDict: {},
      detail: {
        supplyTokenList: [
          {
            asset: createMockAsset({
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              name: 'USD Coin',
              iconUrl: 'https://usdc.logo',
              price: {
                value: 1,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 6,
            }),
            amount: '1000000',
          },
        ],
        rewardTokenList: [],
        borrowTokenList: [],
        tokenList: [],
      },
      stats: {
        assetValue: '1000',
        debtValue: '0',
        netValue: '1000',
      },
    };

    const position = createRainbowPosition();
    const sourcePosition = createMockPosition();

    processPortfolioItem(item, position, sourcePosition, TEST_PARAMS.currency);

    // Should add to deposits, not pools or stakes
    expect(position.deposits).toHaveLength(1);
    expect(position.pools).toHaveLength(0);
    expect(position.stakes).toHaveLength(0);

    // Check deposit details
    const deposit = position.deposits[0];
    expect(deposit.asset.symbol).toBe('USDC');
    expect(deposit.quantity).toBe('1000000');
    expect(deposit.isLp).toBe(false);
    expect(deposit.isConcentratedLiquidity).toBe(false);
  });

  // Test: LP position mapping (TDD Section 4.4.2 - Pools category)
  it('should map LIQUIDITY_POOL positions to pools category', () => {
    const item: PortfolioItem = {
      name: PositionName.LIQUIDITY_POOL,
      updateTime: new Date(),
      detailTypes: [],
      assetDict: {},
      pool: {
        id: '0xpool',
        chainId: 1,
      },
      detail: {
        supplyTokenList: [
          {
            asset: createMockAsset({
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'ETH',
              name: 'Ethereum',
              iconUrl: 'https://eth.logo',
              price: {
                value: 2000,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 18,
            }),
            amount: '1', // 1 ETH (decimal format) (decimal format)
          },
          {
            asset: createMockAsset({
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              name: 'USD Coin',
              iconUrl: 'https://usdc.logo',
              price: {
                value: 1,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 6,
            }),
            amount: '2000', // 2000 USDC (decimal format)
          },
        ],
        rewardTokenList: [],
        borrowTokenList: [],
        tokenList: [],
      },
      stats: {
        assetValue: '4000',
        debtValue: '0',
        netValue: '4000',
      },
    };

    const position = createRainbowPosition();
    const sourcePosition = createMockPosition();

    processPortfolioItem(item, position, sourcePosition, TEST_PARAMS.currency);

    // Should add to pools, not deposits
    expect(position.pools).toHaveLength(1);
    expect(position.deposits).toHaveLength(0);

    // Check pool details
    const pool = position.pools[0];
    expect(pool.pool_address).toBe('0xpool');
    expect(pool.underlying).toHaveLength(2);
    expect(pool.totalValue).toBe('4000');
  });

  // Test: Concentrated liquidity detection (TDD Section 4.5.2 - LP Enhancements)
  it('should detect concentrated liquidity for Uniswap V3 pools', () => {
    const item: PortfolioItem = {
      name: PositionName.LIQUIDITY_POOL,
      updateTime: new Date(),
      detailTypes: [],
      assetDict: {},
      pool: {
        id: '0xv3pool',
        chainId: 1,
      },
      detail: {
        supplyTokenList: [
          {
            asset: createMockAsset({
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'ETH',
              name: 'Ethereum',
              iconUrl: 'https://eth.logo',
              price: {
                value: 2000,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 18,
            }),
            amount: '1', // 1 ETH (decimal format) (decimal format)
          },
        ],
        rewardTokenList: [],
        borrowTokenList: [],
        tokenList: [],
      },
      stats: {
        assetValue: '2000',
        debtValue: '0',
        netValue: '2000',
      },
    };

    const position = createRainbowPosition();
    const sourcePosition = createMockPosition();
    sourcePosition.canonicalProtocolName = 'uniswap';
    sourcePosition.protocolVersion = 'v3';

    processPortfolioItem(item, position, sourcePosition, TEST_PARAMS.currency);

    // Should detect concentrated liquidity
    const pool = position.pools[0];
    expect(pool.isConcentratedLiquidity).toBe(true);
  });

  // Test: Staking position mapping (TDD Section 4.4.2 - Stakes category)
  it('should map STAKED positions to stakes category', () => {
    const item: PortfolioItem = {
      name: PositionName.STAKED,
      updateTime: new Date(),
      detailTypes: [],
      pool: undefined,
      assetDict: {},
      detail: {
        supplyTokenList: [
          {
            asset: createMockAsset({
              address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
              symbol: 'SUSHI',
              name: 'SushiSwap',
              iconUrl: 'https://sushi.logo',
              price: {
                value: 2,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 18,
            }),
            amount: '500', // 500 SUSHI (decimal format)
          },
        ],
        unlockTime: new Date('2024-12-01T00:00:00Z'),
        rewardTokenList: [],
        borrowTokenList: [],
        tokenList: [],
      },
      stats: {
        assetValue: '1000',
        debtValue: '0',
        netValue: '1000',
      },
    };

    const position = createRainbowPosition();
    const sourcePosition = createMockPosition();

    processPortfolioItem(item, position, sourcePosition, TEST_PARAMS.currency);

    // Should add to stakes
    expect(position.stakes).toHaveLength(1);
    expect(position.deposits).toHaveLength(0);

    // Check stake details including unlock time
    const stake = position.stakes[0];
    expect(stake.asset.symbol).toBe('SUSHI');
    expect(stake.unlockTime).toEqual(new Date('2024-12-01T00:00:00Z'));
    expect(stake.isLp).toBe(false);
  });

  // Test: Lending position with borrows (TDD Section 4.4.2 - Borrows category)
  it('should map LENDING positions with borrowTokenList to borrows category', () => {
    const item: PortfolioItem = {
      name: PositionName.LENDING,
      updateTime: new Date(),
      detailTypes: [],
      pool: undefined,
      assetDict: {},
      detail: {
        supplyTokenList: [
          {
            asset: createMockAsset({
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'ETH',
              name: 'Ethereum',
              iconUrl: 'https://eth.logo',
              price: {
                value: 2000,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 18,
            }),
            amount: '5', // 5 ETH (decimal format)
          },
        ],
        borrowTokenList: [
          {
            asset: createMockAsset({
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
              symbol: 'DAI',
              name: 'DAI Stablecoin',
              iconUrl: 'https://dai.logo',
              price: {
                value: 1,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 18,
            }),
            amount: '10000', // 10000 DAI (decimal format)
          },
        ],
        healthRate: 1.5,
        rewardTokenList: [],
        tokenList: [],
      },
      stats: {
        assetValue: '10000',
        debtValue: '10000',
        netValue: '0',
      },
    };

    const position = createRainbowPosition();
    const sourcePosition = createMockPosition();

    processPortfolioItem(item, position, sourcePosition, TEST_PARAMS.currency);

    // Should add to both deposits and borrows
    expect(position.deposits).toHaveLength(1);
    expect(position.borrows).toHaveLength(1);

    // Check deposit details
    const deposit = position.deposits[0];
    expect(deposit.asset.symbol).toBe('ETH');

    // Check borrow details including health rate
    const borrow = position.borrows[0];
    expect(borrow.asset.symbol).toBe('DAI');
    expect(borrow.healthRate).toBe(1.5);
    expect(borrow.totalValue).toBe('10000');
  });

  // Test: Rewards mapping (TDD Section 4.4.2 - Rewards category)
  it('should map REWARDS positions to rewards category', () => {
    const item: PortfolioItem = {
      name: PositionName.REWARDS,
      updateTime: new Date(),
      detailTypes: [],
      pool: undefined,
      assetDict: {},
      detail: {
        supplyTokenList: [],
        rewardTokenList: [
          {
            asset: createMockAsset({
              address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
              symbol: 'COMP',
              name: 'Compound',
              iconUrl: 'https://comp.logo',
              price: {
                value: 50,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 18,
            }),
            amount: '10', // 10 COMP (decimal format)
            claimableAmount: '10000000000000000000', // 10 COMP
          },
        ],
        borrowTokenList: [],
        tokenList: [],
      },
      stats: {
        assetValue: '500',
        debtValue: '0',
        netValue: '500',
      },
    };

    const position = createRainbowPosition();
    const sourcePosition = createMockPosition();

    processPortfolioItem(item, position, sourcePosition, TEST_PARAMS.currency);

    // Should add to rewards
    expect(position.rewards).toHaveLength(1);

    // Check reward details including claimable amount
    const reward = position.rewards[0];
    expect(reward.asset.symbol).toBe('COMP');
    expect(reward.claimableAmount).toBe('10000000000000000000');
    expect(reward.native.amount).toBe('500');
  });

  // Test: Farming positions (staked LP) mapping
  it('should map FARMING positions to stakes with isLp flag', () => {
    const item: PortfolioItem = {
      name: PositionName.FARMING,
      updateTime: new Date(),
      detailTypes: [],
      pool: undefined,
      assetDict: {},
      detail: {
        supplyTokenList: [
          {
            asset: createMockAsset({
              address: '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
              symbol: 'UNI-V2',
              name: 'Uniswap V2 LP',
              iconUrl: 'https://lp.logo',
              price: {
                value: 100,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 18,
            }),
            amount: '10', // 10 LP tokens (decimal format)
          },
        ],
        rewardTokenList: [],
        borrowTokenList: [],
        tokenList: [],
      },
      stats: {
        assetValue: '1000',
        debtValue: '0',
        netValue: '1000',
      },
    };

    const position = createRainbowPosition();
    const sourcePosition = createMockPosition();

    processPortfolioItem(item, position, sourcePosition, TEST_PARAMS.currency);

    // Should add to stakes with LP flag
    expect(position.stakes).toHaveLength(1);

    const stake = position.stakes[0];
    expect(stake.isLp).toBe(true);
    expect(stake.asset.symbol).toBe('UNI-V2');
  });

  // Test: Leveraged farming position mapping (complex positions)
  it('should map LEVERAGED_FARMING with supplies, borrows, and rewards', () => {
    const item: PortfolioItem = {
      name: PositionName.LEVERAGED_FARMING,
      updateTime: new Date(),
      detailTypes: [],
      pool: undefined,
      assetDict: {},
      detail: {
        supplyTokenList: [
          {
            asset: createMockAsset({
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'ETH',
              name: 'Ethereum',
              iconUrl: 'https://eth.logo',
              price: {
                value: 2000,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 18,
            }),
            amount: '10', // 10 ETH (decimal format)
          },
        ],
        borrowTokenList: [
          {
            asset: createMockAsset({
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              name: 'USD Coin',
              iconUrl: 'https://usdc.logo',
              price: {
                value: 1,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 6,
            }),
            amount: '15000', // 15000 USDC (decimal format)
          },
        ],
        rewardTokenList: [
          {
            asset: createMockAsset({
              address: '0xa0246c9032bc3a600820415ae600c6388619a14d',
              symbol: 'FARM',
              name: 'Farm Token',
              iconUrl: 'https://farm.logo',
              price: {
                value: 10,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 18,
            }),
            amount: '50', // 50 FARM (decimal format)
          },
        ],
        tokenList: [],
      },
      stats: {
        assetValue: '20000',
        debtValue: '15000',
        netValue: '5000',
      },
    };

    const position = createRainbowPosition();
    const sourcePosition = createMockPosition();

    processPortfolioItem(item, position, sourcePosition, TEST_PARAMS.currency);

    // Should distribute to multiple categories
    expect(position.deposits).toHaveLength(1);
    expect(position.borrows).toHaveLength(1);
    expect(position.rewards).toHaveLength(1);

    // Check each category
    expect(position.deposits[0].asset.symbol).toBe('ETH');
    expect(position.borrows[0].asset.symbol).toBe('USDC');
    expect(position.rewards[0].asset.symbol).toBe('FARM');
  });

  // Test: Unsupported position types (TDD Section 3 - Out of Scope)
  it('should skip unsupported position types like PERPETUALS', () => {
    const item: PortfolioItem = {
      name: PositionName.PERPETUALS,
      updateTime: new Date(),
      detailTypes: [],
      pool: undefined,
      assetDict: {},
      detail: {
        supplyTokenList: [],
        rewardTokenList: [],
        borrowTokenList: [],
        tokenList: [],
      },
      stats: {
        assetValue: '10000',
        debtValue: '0',
        netValue: '10000',
      },
    };

    const position = createRainbowPosition();
    const sourcePosition = createMockPosition();

    processPortfolioItem(item, position, sourcePosition, TEST_PARAMS.currency);

    // Should not add any positions
    expect(position.deposits).toHaveLength(0);
    expect(position.pools).toHaveLength(0);
    expect(position.stakes).toHaveLength(0);
    expect(position.borrows).toHaveLength(0);
    expect(position.rewards).toHaveLength(0);
  });

  // Test: Version tracking for positions
  it('should include protocol version in position items', () => {
    const item: PortfolioItem = {
      name: PositionName.DEPOSIT,
      updateTime: new Date(),
      detailTypes: [],
      pool: undefined,
      assetDict: {},
      detail: {
        supplyTokenList: [
          {
            asset: createMockAsset({
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              name: 'USD Coin',
              iconUrl: 'https://usdc.logo',
              price: {
                value: 1,
                changedAt: new Date(),
                relativeChange24h: 0,
              },
              decimals: 6,
            }),
            amount: '1000000',
          },
        ],
        rewardTokenList: [],
        borrowTokenList: [],
        tokenList: [],
      },
      stats: {
        assetValue: '1000',
        debtValue: '0',
        netValue: '1000',
      },
    };

    const position = createRainbowPosition();
    const sourcePosition = createMockPosition();
    sourcePosition.protocolVersion = 'v3';

    processPortfolioItem(item, position, sourcePosition, TEST_PARAMS.currency);

    // Should track dapp version
    expect(position.deposits[0].dappVersion).toBe('v3');
  });
});
