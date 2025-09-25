import type { ListPositionsResponse, Position, PortfolioItem } from '../types';
import { logger } from '@/logger';

/**
 * Validate the overall response structure
 */
export function validatePositionResponse(response: ListPositionsResponse): boolean {
  try {
    // Check for required fields
    if (!response) {
      logger.warn('[Response] Invalid response: null or undefined');
      return false;
    }

    // Check if there's a result (required for successful response)
    if (!response.result) {
      // If no result field, check if there are errors
      if (!response.errors || response.errors.length === 0) {
        logger.warn('[Response] Invalid response: no result and no errors');
        return false;
      }
      // Valid error response
      return false; // Still return false since there's no valid data
    }

    // Validate positions array
    if (!Array.isArray(response.result.positions)) {
      logger.warn('[Response] Invalid positions: not an array');
      return false;
    }

    // Validate each position
    for (const position of response.result.positions) {
      if (!validatePosition(position)) {
        return false;
      }
    }

    // Validate uniqueTokens (optional in real backend)
    if (response.result.uniqueTokens !== undefined && !Array.isArray(response.result.uniqueTokens)) {
      logger.warn('[Response] Invalid uniqueTokens: not an array');
      return false;
    }

    // Validate errors array (optional - real backend doesn't include it)
    if (response.errors !== undefined && !Array.isArray(response.errors)) {
      logger.warn('[Response] Invalid errors: not an array');
      return false;
    }

    return true;
  } catch (error) {
    logger.error(new Error('[Response] Validation error'), { error });
    return false;
  }
}

/**
 * Validate individual position structure
 */
export function validatePosition(position: Position): boolean {
  // Check required fields
  if (!position.id || typeof position.id !== 'string') {
    logger.warn('[Response] Invalid position: missing or invalid id');
    return false;
  }

  if (!position.protocolName || typeof position.protocolName !== 'string') {
    logger.warn('[Response] Invalid position: missing or invalid protocolName');
    return false;
  }

  if (!position.canonicalProtocolName || typeof position.canonicalProtocolName !== 'string') {
    logger.warn('[Response] Invalid position: missing or invalid canonicalProtocolName');
    return false;
  }

  // protocolVersion is optional in real data
  if (position.protocolVersion !== undefined && typeof position.protocolVersion !== 'string') {
    logger.warn('[Response] Invalid position: protocolVersion must be string if present');
    return false;
  }

  if (typeof position.chainId !== 'number') {
    logger.warn('[Response] Invalid position: missing or invalid chainId');
    return false;
  }

  if (!Array.isArray(position.portfolioItems)) {
    logger.warn('[Response] Invalid position: portfolioItems not an array');
    return false;
  }

  // Validate each portfolio item
  for (const item of position.portfolioItems) {
    if (!processPositionData.validatePortfolioItem(item)) {
      return false;
    }
  }

  return true;
}

// Export validatePortfolioItem directly for use in portfolio.ts
export function validatePortfolioItem(item: PortfolioItem): boolean {
  return processPositionData.validatePortfolioItem(item);
}

/**
 * Processing utilities for position data
 */
export const processPositionData = {
  /**
   * Validate asset structure
   */
  validateAsset(asset: unknown): boolean {
    if (!asset || typeof asset !== 'object') {
      logger.warn('[Response] Invalid asset: not an object');
      return false;
    }

    const assetObj = asset as Record<string, unknown>;

    // Check required fields and types
    // Real backend uses 'address' instead of 'id'
    if (typeof assetObj.id !== 'string' && typeof assetObj.address !== 'string') {
      logger.warn('[Response] Invalid asset: must have id or address as string');
      return false;
    }

    if (typeof assetObj.symbol !== 'string') {
      logger.warn('[Response] Invalid asset: symbol must be string');
      return false;
    }

    if (typeof assetObj.name !== 'string') {
      logger.warn('[Response] Invalid asset: name must be string');
      return false;
    }

    // Decimals can be string or number in real data
    if (typeof assetObj.decimals !== 'number' && typeof assetObj.decimals !== 'string') {
      logger.warn('[Response] Invalid asset: decimals must be number or string');
      return false;
    }

    return true;
  },

  /**
   * Validate portfolio item structure
   */
  validatePortfolioItem(item: PortfolioItem): boolean {
    if (!item || typeof item !== 'object') {
      logger.warn('[Response] Invalid portfolio item: not an object');
      return false;
    }

    // Check required fields (can be string or number enum)
    if (typeof item.name !== 'number' && typeof item.name !== 'string') {
      logger.warn('[Response] Invalid portfolio item: name must be number or string (enum)');
      return false;
    }

    if (!Array.isArray(item.detailTypes)) {
      logger.warn('[Response] Invalid portfolio item: detailTypes must be array');
      return false;
    }

    // Validate stats
    if (item.stats) {
      if (typeof item.stats.assetValue !== 'string') {
        logger.warn('[Response] Invalid stats: assetValue must be string');
        return false;
      }
      if (typeof item.stats.debtValue !== 'string') {
        logger.warn('[Response] Invalid stats: debtValue must be string');
        return false;
      }
      if (typeof item.stats.netValue !== 'string') {
        logger.warn('[Response] Invalid stats: netValue must be string');
        return false;
      }
    }

    // Validate detail
    if (item.detail) {
      if (!this.validateTokenList(item.detail.supplyTokenList)) {
        return false;
      }
      if (!this.validateTokenList(item.detail.rewardTokenList)) {
        return false;
      }
      if (!this.validateTokenList(item.detail.borrowTokenList)) {
        return false;
      }
      if (!this.validateTokenList(item.detail.tokenList)) {
        return false;
      }
    }

    return true;
  },

  /**
   * Validate token list structure
   */
  validateTokenList(tokenList: unknown): boolean {
    // Token lists can be undefined in real backend response
    if (tokenList === undefined || tokenList === null) {
      return true;
    }

    if (!Array.isArray(tokenList)) {
      logger.warn('[Response] Invalid token list: not an array');
      return false;
    }

    for (const token of tokenList) {
      if (!token || typeof token !== 'object') {
        logger.warn('[Response] Invalid token: not an object');
        return false;
      }

      if (!token.asset || !this.validateAsset(token.asset)) {
        logger.warn('[Response] Invalid token: invalid asset');
        return false;
      }

      if (typeof token.amount !== 'string') {
        logger.warn('[Response] Invalid token: amount must be string');
        return false;
      }
    }

    return true;
  },

  /**
   * Validate unique tokens array
   */
  validateUniqueTokens(uniqueTokens: unknown): boolean {
    if (!Array.isArray(uniqueTokens)) {
      logger.warn('[Response] Invalid unique tokens: not an array');
      return false;
    }

    for (const token of uniqueTokens) {
      if (typeof token !== 'string') {
        logger.warn('[Response] Invalid unique token: not a string');
        return false;
      }

      // Check format: should be "id:chainId:address"
      const parts = token.split(':');
      if (parts.length !== 3) {
        logger.warn('[Response] Invalid unique token format: ' + token);
        return false;
      }
    }

    return true;
  },

  /**
   * Check if chain ID is supported
   */
  isValidChainId(chainId: number): boolean {
    const supportedChains = [1, 10, 56, 137, 250, 42161, 43114, 8453, 81457, 5000];
    return supportedChains.includes(chainId);
  },
};
