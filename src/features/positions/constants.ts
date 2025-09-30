/**
 * Constants for positions feature
 */

import type { RainbowPositions } from './types';

// Minimum position value in USD to display
export const MIN_POSITION_VALUE_USD = 1;

// Hyperliquid protocol identifier
export const HYPERLIQUID_PROTOCOL = 'hyperliquid';

// Concentrated liquidity protocols
export const CONCENTRATED_LIQUIDITY_PROTOCOLS = ['uniswap-v3', 'pancakeswap-v3', 'algebra', 'kyberswap-elastic'];

// Empty positions object
export const EMPTY_POSITIONS: RainbowPositions = {
  positions: {},
  positionTokens: [],
  totals: {
    totals: { amount: '0', display: '$0.00' },
    totalDeposits: { amount: '0', display: '$0.00' },
    totalBorrows: { amount: '0', display: '$0.00' },
    totalRewards: { amount: '0', display: '$0.00' },
    totalLocked: '0',
  },
};

// Cache configuration
export const CACHE_TIME = 1000 * 60 * 5; // 5 minutes
export const STALE_TIME = 1000 * 60 * 1; // 1 minute
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
