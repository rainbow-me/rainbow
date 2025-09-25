/**
 * Tests for response validation and parsing functions
 * References debank-positions-tdd.md for response structure validation
 */

import { validatePositionResponse, processPositionData } from '../../parsers/response';
import { LIST_POSITIONS_SUCCESS } from '../../__fixtures__/ListPositions';
import type { ListPositionsResponse, PortfolioItem } from '../../types';

// Mock dependencies
jest.mock('@/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Response Parser', () => {
  describe('Response Structure Validation', () => {
    // Test: Valid real backend response structure
    it('should validate real backend response structure', () => {
      const result = validatePositionResponse(LIST_POSITIONS_SUCCESS);
      expect(result).toBe(true);
    });

    // Test: Missing result field
    it('should reject response without result field', () => {
      const invalidResponse = {
        errors: [],
      } as unknown as ListPositionsResponse;

      const result = validatePositionResponse(invalidResponse);
      expect(result).toBe(false);
    });

    // Test: Invalid positions array
    it('should reject response with invalid positions array', () => {
      const invalidResponse = {
        result: {
          positions: 'not an array',
          uniqueTokens: [],
        },
        errors: [],
      } as unknown as ListPositionsResponse;

      const result = validatePositionResponse(invalidResponse);
      expect(result).toBe(false);
    });

    // Test: Missing required position fields
    it('should reject positions missing required fields', () => {
      const invalidResponse = {
        metadata: undefined,
        result: {
          positions: [
            {
              id: 'test',
              // Missing required fields: protocolName, canonicalProtocolName, etc.
            },
          ],
          uniqueTokens: [],
        },
        errors: [],
      } as unknown as ListPositionsResponse;

      const result = validatePositionResponse(invalidResponse);
      expect(result).toBe(false);
    });
  });

  describe('Asset Validation', () => {
    // Test: Valid asset structure (TDD Section 4.5.2)
    it('should validate correct asset structure', () => {
      const asset = {
        id: 'usdc',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        price: '1.0001',
        logoUrl: 'https://logo.url',
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: 1,
      };

      const isValid = processPositionData.validateAsset(asset);
      expect(isValid).toBe(true);
    });

    // Test: Asset with missing required fields
    it('should reject asset missing required fields', () => {
      const invalidAssets = [
        { symbol: 'USDC' }, // Missing id, name, decimals
        { id: 'usdc', name: 'USD Coin' }, // Missing symbol, decimals
        { id: 'usdc', symbol: 'USDC', name: 'USD Coin' }, // Missing decimals
      ];

      invalidAssets.forEach(asset => {
        const isValid = processPositionData.validateAsset(asset);
        expect(isValid).toBe(false);
      });
    });

    // Test: Asset with invalid types
    it('should reject asset with invalid field types', () => {
      const invalidAsset = {
        id: 123, // Should be string
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: '6', // Should be number
        price: 1.0001, // String is acceptable but number should work too
      };

      const isValid = processPositionData.validateAsset(invalidAsset);
      expect(isValid).toBe(false);
    });
  });

  describe('PortfolioItem Validation', () => {
    // Test: Valid portfolio item structure from real data
    it('should validate real backend portfolio item structure', () => {
      const item = LIST_POSITIONS_SUCCESS.result?.positions[0]?.portfolioItems[0];
      expect(item).toBeDefined();

      if (!item) {
        throw new Error('Item should be defined');
      }

      const isValid = processPositionData.validatePortfolioItem(item);
      expect(isValid).toBe(true);
    });

    // Test: Portfolio item with invalid stats
    it('should reject portfolio item with invalid stats', () => {
      const invalidItem = {
        name: 70, // LENDING
        detailTypes: [30],
        updateTime: new Date(),
        pool: undefined,
        stats: {
          assetValue: null, // Invalid
          debtValue: '0',
          netValue: '1000',
        },
        detail: {
          supplyTokenList: [],
          rewardTokenList: [],
          borrowTokenList: [],
          tokenList: [],
        },
        assetDict: {},
      } as unknown as PortfolioItem;

      const isValid = processPositionData.validatePortfolioItem(invalidItem);
      expect(isValid).toBe(false);
    });
  });

  describe('Error Response Handling', () => {
    // Test: Handle error response (TDD Section 4.5.3)
    it('should handle error response gracefully', () => {
      const errorResponse: ListPositionsResponse = {
        metadata: undefined,
        result: undefined,
        errors: ['Failed to fetch positions: Network timeout', 'Chain 42161 temporarily unavailable'],
      };

      const result = validatePositionResponse(errorResponse);
      expect(result).toBe(false); // No result field
      expect(errorResponse.errors).toHaveLength(2);
    });

    // Test: Handle empty response
    it('should handle empty positions response', () => {
      const emptyResponse: ListPositionsResponse = {
        metadata: undefined,
        result: {
          positions: [],
          uniqueTokens: [],
        },
        errors: [],
      };

      const result = validatePositionResponse(emptyResponse);
      expect(result).toBe(true); // Valid structure, just empty
      expect(emptyResponse.result?.positions).toHaveLength(0);
    });
  });

  describe('Chain ID Validation', () => {
    // Test: Valid chain IDs (TDD Section 4.5.2)
    it('should validate supported chain IDs', () => {
      const supportedChains = [1, 10, 56, 137, 250, 42161, 43114, 8453, 81457, 5000];

      supportedChains.forEach(chainId => {
        const isValid = processPositionData.isValidChainId(chainId);
        expect(isValid).toBe(true);
      });
    });

    // Test: Invalid chain IDs
    it('should reject unsupported chain IDs', () => {
      const unsupportedChains = [0, 999, -1, 420690];

      unsupportedChains.forEach(chainId => {
        const isValid = processPositionData.isValidChainId(chainId);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Token List Validation', () => {
    // Test: Valid token list structure
    it('should validate correct token list structure', () => {
      const tokenList = [
        {
          asset: {
            id: 'usdc',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            price: '1',
          },
          amount: '1000',
        },
        {
          asset: {
            id: 'eth',
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            price: '2000',
          },
          amount: '5',
          isCollateral: true, // Optional field for lending
        },
      ];

      const isValid = processPositionData.validateTokenList(tokenList);
      expect(isValid).toBe(true);
    });

    // Test: Invalid token list
    it('should reject invalid token list', () => {
      // null and undefined are valid (optional fields)
      expect(processPositionData.validateTokenList(null)).toBe(true);
      expect(processPositionData.validateTokenList(undefined)).toBe(true);

      // These should be invalid
      const invalidLists = [
        'not an array',
        [{ amount: '100' }], // Missing asset
        [{ asset: null, amount: '100' }], // Null asset
      ];

      invalidLists.forEach(list => {
        const isValid = processPositionData.validateTokenList(list);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('UniqueTokens Validation', () => {
    // Test: Valid unique tokens array
    it('should validate unique tokens structure', () => {
      const uniqueTokens = [
        'usdc:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        'eth:1:0x0000000000000000000000000000000000000000',
        'dai:137:0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
      ];

      const isValid = processPositionData.validateUniqueTokens(uniqueTokens);
      expect(isValid).toBe(true);
    });

    // Test: Invalid unique tokens
    it('should reject invalid unique tokens format', () => {
      const invalidTokens = [
        ['not-a-string-format'], // Missing colons
        ['usdc:1'], // Missing address part
        [123], // Not a string
      ];

      invalidTokens.forEach(tokens => {
        const isValid = processPositionData.validateUniqueTokens(tokens);
        expect(isValid).toBe(false);
      });
    });
  });
});
