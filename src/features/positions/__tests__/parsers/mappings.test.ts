/**
 * Tests for mappings.ts parser
 * References debank-positions-tdd.md Section 4.5.2 for position type mapping logic
 */

import { mapPortfolioItemToCategories, shouldFilterPositionType, isLpPosition } from '../../parsers/mappings';
import { PositionName, type PortfolioItem, type PositionToken } from '../../types';
import type { Asset } from '../../types/generated/common/asset';

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

describe('Mappings Parser', () => {
  describe('mapPortfolioItemToCategories', () => {
    // Test: Map lending positions to supply tokens (TDD Section 4.4.2)
    it('should map LENDING positions to supplyTokens category', () => {
      const tokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            name: 'USD Coin',
            iconUrl: 'https://usdc.logo',
            price: { value: 1, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 6,
          }),
          amount: '1000',
        },
      ];

      const item: PortfolioItem = {
        name: PositionName.LENDING,
        detail: {
          supplyTokenList: tokens,
          rewardTokenList: [],
          borrowTokenList: [],
          tokenList: [],
        },
        stats: {
          assetValue: '1000',
          debtValue: '0',
          netValue: '1000',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      expect(result.supplyTokens).toEqual(tokens);
      expect(result.stakeTokens).toEqual([]);
      expect(result.borrowTokens).toEqual([]);
      expect(result.rewardTokens).toEqual([]);
    });

    // Test: Map deposited positions to supply tokens (TDD Section 4.4.2)
    it('should map DEPOSITED positions to supplyTokens category', () => {
      const tokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            symbol: 'ETH',
            name: 'Ethereum',
            iconUrl: 'https://eth.logo',
            price: { value: 2000, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '1',
        },
      ];

      const item: PortfolioItem = {
        name: PositionName.DEPOSIT,
        detail: {
          supplyTokenList: tokens,
          rewardTokenList: [],
          borrowTokenList: [],
          tokenList: [],
        },
        stats: {
          assetValue: '1',
          debtValue: '0',
          netValue: '1',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      expect(result.supplyTokens).toEqual(tokens);
      expect(result.stakeTokens).toEqual([]);
    });

    // Test: Map liquidity pool positions (TDD Section 4.4.2 - Pools)
    it('should map LIQUIDITY_POOL positions to supplyTokens for pool display', () => {
      const tokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            symbol: 'ETH',
            name: 'Ethereum',
            iconUrl: 'https://eth.logo',
            price: { value: 2000, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '1',
        },
        {
          asset: createMockAsset({
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            name: 'USD Coin',
            iconUrl: 'https://usdc.logo',
            price: { value: 1, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 6,
          }),
          amount: '2000',
        },
      ];

      const item: PortfolioItem = {
        name: PositionName.LIQUIDITY_POOL,
        detail: {
          supplyTokenList: tokens,
          rewardTokenList: [],
          borrowTokenList: [],
          tokenList: [],
        },
        stats: {
          assetValue: '3000',
          debtValue: '0',
          netValue: '3000',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      // LP positions use supplyTokens to represent pool assets
      expect(result.supplyTokens).toEqual(tokens);
      expect(result.supplyTokens).toHaveLength(2);
    });

    // Test: Map staked positions (TDD Section 4.4.2 - Stakes)
    it('should map STAKED positions to stakeTokens category', () => {
      const tokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
            symbol: 'SUSHI',
            name: 'SushiSwap',
            iconUrl: 'https://sushi.logo',
            price: { value: 2, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '500',
        },
      ];

      const item: PortfolioItem = {
        name: PositionName.STAKED,
        detail: {
          supplyTokenList: tokens, // Staked positions use supplyTokenList
          rewardTokenList: [],
          borrowTokenList: [],
          tokenList: [],
        },
        stats: {
          assetValue: '1000',
          debtValue: '0',
          netValue: '1000',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      expect(result.stakeTokens).toEqual(tokens);
      expect(result.supplyTokens).toEqual([]);
    });

    // Test: Map locked positions (TDD Section 4.4.2 - Stakes with unlock)
    it('should map LOCKED positions to stakeTokens category', () => {
      const tokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0xd533a949740bb3306d119cc777fa900ba034cd52',
            symbol: 'CRV',
            name: 'Curve',
            iconUrl: 'https://crv.logo',
            price: { value: 1, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '1000',
        },
      ];

      const item: PortfolioItem = {
        name: PositionName.LOCKED,
        detail: {
          supplyTokenList: tokens, // Locked positions use supplyTokenList
          rewardTokenList: [],
          borrowTokenList: [],
          tokenList: [],
        },
        stats: {
          assetValue: '1000',
          debtValue: '0',
          netValue: '1000',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      expect(result.stakeTokens).toEqual(tokens);
      expect(result.supplyTokens).toEqual([]);
    });

    // Test: Map lending positions with borrows (TDD Section 4.4.2 - Borrows)
    it('should map LENDING positions with borrowTokenList to borrowTokens category', () => {
      const borrowTokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            symbol: 'DAI',
            name: 'DAI Stablecoin',
            iconUrl: 'https://dai.logo',
            price: { value: 1, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '10000',
        },
      ];

      const supplyTokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            symbol: 'ETH',
            name: 'Ethereum',
            iconUrl: 'https://eth.logo',
            price: { value: 2000, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '5',
        },
      ];

      const item: PortfolioItem = {
        name: PositionName.LENDING,
        detail: {
          supplyTokenList: supplyTokens,
          borrowTokenList: borrowTokens,
          rewardTokenList: [],
          tokenList: [],
        },
        stats: {
          assetValue: '10000',
          debtValue: '10000',
          netValue: '0',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      expect(result.borrowTokens).toEqual(borrowTokens);
      expect(result.supplyTokens).toEqual(supplyTokens);
    });

    // Test: Map reward positions (TDD Section 4.4.2 - Rewards/Claimables)
    it('should map REWARDS positions to rewardTokens category', () => {
      const tokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
            symbol: 'COMP',
            name: 'Compound',
            iconUrl: 'https://comp.logo',
            price: { value: 50, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '10',
          claimableAmount: '10',
        },
      ];

      const item: PortfolioItem = {
        name: PositionName.REWARDS,
        detail: {
          supplyTokenList: [],
          rewardTokenList: tokens,
          borrowTokenList: [],
          tokenList: [],
        },
        stats: {
          assetValue: '500',
          debtValue: '0',
          netValue: '500',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      expect(result.rewardTokens).toEqual(tokens);
      expect(result.supplyTokens).toEqual([]);
    });

    // Test: Map vesting positions (TDD Section 4.4.2 - Rewards with vesting)
    it('should map VESTING positions to rewardTokens category', () => {
      const tokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            symbol: 'UNI',
            name: 'Uniswap',
            iconUrl: 'https://uni.logo',
            price: { value: 5, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '1000',
          claimableAmount: '100',
        },
      ];

      const item: PortfolioItem = {
        name: PositionName.VESTING,
        detail: {
          supplyTokenList: [],
          rewardTokenList: tokens,
          borrowTokenList: [],
          tokenList: [],
        },
        stats: {
          assetValue: '5000',
          debtValue: '0',
          netValue: '5000',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      expect(result.rewardTokens).toEqual(tokens);
    });

    // Test: Map farming positions (complex staked LP)
    it('should split FARMING positions into stake and reward tokens', () => {
      const stakeTokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
            symbol: 'LP',
            name: 'LP Token',
            iconUrl: 'https://lp.logo',
            price: { value: 100, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '10',
        },
      ];

      const rewardTokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0xa0246c9032bc3a600820415ae600c6388619a14d',
            symbol: 'FARM',
            name: 'Farm Reward',
            iconUrl: 'https://farm.logo',
            price: { value: 10, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '50',
        },
      ];

      const item: PortfolioItem = {
        name: PositionName.FARMING,
        detail: {
          supplyTokenList: stakeTokens,
          rewardTokenList: rewardTokens,
          borrowTokenList: [],
          tokenList: [],
        },
        stats: {
          assetValue: '1500',
          debtValue: '0',
          netValue: '1500',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      // Staked LP tokens
      expect(result.stakeTokens).toEqual(stakeTokens);
      // Farming rewards
      expect(result.rewardTokens).toEqual(rewardTokens);
    });

    // Test: Map leveraged farming (most complex position type)
    it('should split LEVERAGED_FARMING into supply, borrow, and reward tokens', () => {
      const supplyTokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            symbol: 'ETH',
            name: 'Ethereum',
            iconUrl: 'https://eth.logo',
            price: { value: 2000, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '10',
        },
      ];

      const borrowTokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            name: 'USD Coin',
            iconUrl: 'https://usdc.logo',
            price: { value: 1, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 6,
          }),
          amount: '15000',
        },
      ];

      const rewardTokens: PositionToken[] = [
        {
          asset: createMockAsset({
            address: '0xa1faa113cbe53436df28ff0aee54275c13b40975',
            symbol: 'ALPHA',
            name: 'Alpha',
            iconUrl: 'https://alpha.logo',
            price: { value: 1, changedAt: new Date(), relativeChange24h: 0 },
            decimals: 18,
          }),
          amount: '1000',
        },
      ];

      const item: PortfolioItem = {
        name: PositionName.LEVERAGED_FARMING,
        detail: {
          supplyTokenList: supplyTokens,
          borrowTokenList: borrowTokens,
          rewardTokenList: rewardTokens,
          tokenList: [],
        },
        stats: {
          assetValue: '20000',
          debtValue: '15000',
          netValue: '5000',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      // Check supply tokens
      expect(result.supplyTokens).toEqual(supplyTokens);
      // Check borrow tokens
      expect(result.borrowTokens).toEqual(borrowTokens);
      // Check reward tokens
      expect(result.rewardTokens).toEqual(rewardTokens);
    });

    // Test: Handle empty token lists
    it('should handle items with no detail gracefully', () => {
      const item: PortfolioItem = {
        name: PositionName.DEPOSIT,
        stats: {
          assetValue: '0',
          debtValue: '0',
          netValue: '0',
        },
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        detail: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      expect(result.supplyTokens).toEqual([]);
      expect(result.stakeTokens).toEqual([]);
      expect(result.borrowTokens).toEqual([]);
      expect(result.rewardTokens).toEqual([]);
    });

    // Test: Handle unknown position types
    it('should return empty categories for unknown position types', () => {
      const item: PortfolioItem = {
        name: 'UNKNOWN_TYPE' as PositionName,
        detail: {
          supplyTokenList: [
            {
              asset: createMockAsset({
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'UNK',
                name: 'Unknown',
                iconUrl: 'https://unk.logo',
                price: { value: 1, changedAt: new Date(), relativeChange24h: 0 },
                decimals: 18,
              }),
              amount: '1000',
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
        updateTime: new Date(),
        detailTypes: [],
        pool: undefined,
        assetDict: {},
      };

      const result = mapPortfolioItemToCategories(item);

      // Should not map unknown types
      expect(result.supplyTokens).toEqual([]);
      expect(result.stakeTokens).toEqual([]);
      expect(result.borrowTokens).toEqual([]);
      expect(result.rewardTokens).toEqual([]);
    });
  });

  describe('shouldFilterPositionType', () => {
    // Test: Filter unsupported position types (TDD Section 3 - Out of Scope)
    it('should filter out PERPETUALS positions', () => {
      expect(shouldFilterPositionType(PositionName.PERPETUALS)).toBe(true);
    });

    it('should filter out OPTIONS positions', () => {
      expect(shouldFilterPositionType(PositionName.OPTIONS_BUYER)).toBe(true);
    });

    it('should filter out INSURANCE_BUYER positions', () => {
      expect(shouldFilterPositionType(PositionName.INSURANCE_BUYER)).toBe(true);
    });

    it('should filter out INSURANCE_SELLER positions', () => {
      expect(shouldFilterPositionType(PositionName.INSURANCE_SELLER)).toBe(true);
    });

    // Test: Allow supported position types
    it('should not filter LENDING positions', () => {
      expect(shouldFilterPositionType(PositionName.LENDING)).toBe(false);
    });

    it('should not filter LIQUIDITY_POOL positions', () => {
      expect(shouldFilterPositionType(PositionName.LIQUIDITY_POOL)).toBe(false);
    });

    it('should not filter STAKED positions', () => {
      expect(shouldFilterPositionType(PositionName.STAKED)).toBe(false);
    });

    it('should not filter REWARDS positions', () => {
      expect(shouldFilterPositionType(PositionName.REWARDS)).toBe(false);
    });
  });

  describe('isLpPosition', () => {
    // Test: Identify LP positions (TDD Section 4.4.2 - LP detection)
    it('should identify LIQUIDITY_POOL as LP position', () => {
      expect(isLpPosition(PositionName.LIQUIDITY_POOL)).toBe(true);
    });

    it('should identify FARMING as LP position (staked LP)', () => {
      expect(isLpPosition(PositionName.FARMING)).toBe(true);
    });

    // Test: Non-LP positions
    it('should not identify LENDING as LP position', () => {
      expect(isLpPosition(PositionName.LENDING)).toBe(false);
    });

    it('should not identify STAKED as LP position', () => {
      expect(isLpPosition(PositionName.STAKED)).toBe(false);
    });

    it('should not identify DEPOSITED as LP position', () => {
      expect(isLpPosition(PositionName.DEPOSIT)).toBe(false);
    });

    it('should not identify REWARDS as LP position', () => {
      expect(isLpPosition(PositionName.REWARDS)).toBe(false);
    });
  });
});
