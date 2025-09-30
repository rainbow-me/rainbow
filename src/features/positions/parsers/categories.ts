import type {
  PortfolioItem,
  Position,
  PositionToken,
  RainbowPosition,
  RainbowDeposit,
  RainbowPool,
  RainbowStake,
  RainbowBorrow,
  RainbowReward,
  CategoryResult,
} from '../types';
import { mapPortfolioItemToCategories, shouldFilterPositionType, isLpPosition } from './mappings';
import { processUnderlyingAssets, calculateTotalValue, calculateTokenNativeDisplay } from './values';
import { isConcentratedLiquidity } from './lp';
import { calculateRangeStatus, calculateAllocationPercentages } from './range';
import { logger } from '@/logger';

/**
 * Process a portfolio item and add to appropriate categories
 */
export function processPortfolioItem(item: PortfolioItem, position: RainbowPosition, sourcePosition: Position, currency: string): void {
  // Skip unsupported position types
  if (shouldFilterPositionType(item.name)) {
    logger.debug('[Categories] Skipping unsupported position type: ' + item.name);
    return;
  }

  // Map to UI categories
  const categories = mapPortfolioItemToCategories(item);

  // Process each category
  processCategories(position, categories, item, sourcePosition, currency);
}

/**
 * Process categorized tokens into Rainbow types
 */
function processCategories(
  position: RainbowPosition,
  categories: CategoryResult,
  item: PortfolioItem,
  sourcePosition: Position,
  currency: string
): void {
  const dappVersion = sourcePosition.protocolVersion;

  // Process supply tokens (deposits or pools)
  if (categories.supplyTokens?.length) {
    if (isLpPosition(item.name)) {
      const pools = transformToPools(categories.supplyTokens, item, sourcePosition, currency, dappVersion);
      position.pools.push(...pools);
    } else {
      const deposits = transformToDeposits(categories.supplyTokens, item, sourcePosition, currency, dappVersion);
      position.deposits.push(...deposits);
    }
  }

  // Process stake tokens
  if (categories.stakeTokens?.length) {
    const stakes = transformToStakes(categories.stakeTokens, item, sourcePosition, currency, dappVersion);
    position.stakes.push(...stakes);
  }

  // Process borrow tokens
  if (categories.borrowTokens?.length) {
    const borrows = transformToBorrows(categories.borrowTokens, item, sourcePosition, currency, dappVersion);
    position.borrows.push(...borrows);
  }

  // Process reward tokens
  if (categories.rewardTokens?.length) {
    const rewards = transformToRewards(categories.rewardTokens, item, sourcePosition, currency, dappVersion);
    position.rewards.push(...rewards);
  }
}

/**
 * Transform tokens to deposits
 */
function transformToDeposits(
  tokens: PositionToken[],
  item: PortfolioItem,
  position: Position,
  currency: string,
  dappVersion?: string
): RainbowDeposit[] {
  return tokens
    .map(token => {
      const underlying = processUnderlyingAssets([token], currency);
      if (underlying.length === 0) return null;

      return {
        asset: underlying[0].asset,
        quantity: token.amount,
        pool_address: item.pool?.id,
        isLp: false,
        isConcentratedLiquidity: false,
        totalValue: calculateTotalValue(underlying),
        underlying,
        omit_from_total: item.assetDict?.['omit_from_total'] === 'true',
        dappVersion,
      } as RainbowDeposit;
    })
    .filter((deposit): deposit is RainbowDeposit => deposit !== null);
}

/**
 * Transform tokens to LP pools
 */
function transformToPools(
  tokens: PositionToken[],
  item: PortfolioItem,
  position: Position,
  currency: string,
  dappVersion?: string
): RainbowPool[] {
  // For LP positions, all supply tokens represent the pool
  const underlying = processUnderlyingAssets(tokens, currency);
  if (underlying.length === 0) return [];

  // Sort underlying assets by value (highest first)
  const sortedUnderlying = [...underlying].sort((a, b) => {
    const valueA = parseFloat(a.native?.amount || '0');
    const valueB = parseFloat(b.native?.amount || '0');
    return valueB - valueA;
  });

  const concentrated = isConcentratedLiquidity(position.canonicalProtocolName, position.protocolVersion);

  return [
    {
      asset: sortedUnderlying[0].asset, // Use highest value asset
      quantity: tokens[0]?.amount || '0',
      pool_address: item.pool?.id,
      isConcentratedLiquidity: concentrated,
      rangeStatus: calculateRangeStatus(sortedUnderlying, concentrated),
      allocation: calculateAllocationPercentages(sortedUnderlying),
      totalValue: calculateTotalValue(sortedUnderlying),
      underlying: sortedUnderlying,
      omit_from_total: item.assetDict?.['omit_from_total'] === 'true',
      dappVersion,
    } as RainbowPool,
  ];
}

/**
 * Transform tokens to stakes
 */
function transformToStakes(
  tokens: PositionToken[],
  item: PortfolioItem,
  position: Position,
  currency: string,
  dappVersion?: string
): RainbowStake[] {
  return tokens
    .map(token => {
      const underlying = processUnderlyingAssets([token], currency);
      if (underlying.length === 0) return null;

      const isLp = isLpPosition(item.name);

      return {
        asset: underlying[0].asset,
        quantity: token.amount,
        pool_address: item.pool?.id,
        isLp,
        isConcentratedLiquidity: false,
        totalValue: calculateTotalValue(underlying),
        underlying,
        omit_from_total: item.assetDict?.['omit_from_total'] === 'true',
        dappVersion,
        unlockTime: item.detail?.unlockTime,
      } as RainbowStake;
    })
    .filter((stake): stake is RainbowStake => stake !== null);
}

/**
 * Transform tokens to borrows
 */
function transformToBorrows(
  tokens: PositionToken[],
  item: PortfolioItem,
  position: Position,
  currency: string,
  dappVersion?: string
): RainbowBorrow[] {
  return tokens
    .map(token => {
      const underlying = processUnderlyingAssets([token], currency);
      if (underlying.length === 0) return null;

      return {
        asset: underlying[0].asset,
        quantity: token.amount,
        pool_address: item.pool?.id,
        totalValue: calculateTotalValue(underlying),
        underlying,
        omit_from_total: item.assetDict?.['omit_from_total'] === 'true',
        dappVersion,
        healthRate: item.detail?.healthRate,
      } as RainbowBorrow;
    })
    .filter((borrow): borrow is RainbowBorrow => borrow !== null);
}

/**
 * Transform tokens to rewards
 */
function transformToRewards(
  tokens: PositionToken[],
  item: PortfolioItem,
  position: Position,
  currency: string,
  dappVersion?: string
): RainbowReward[] {
  return tokens
    .map(token => {
      const underlying = processUnderlyingAssets([token], currency);
      if (underlying.length === 0) return null;

      return {
        asset: underlying[0].asset,
        quantity: token.amount,
        native: calculateTokenNativeDisplay(token, currency),
        omit_from_total: item.assetDict?.['omit_from_total'] === 'true',
        dappVersion,
        claimableAmount: token.claimableAmount,
      } as RainbowReward;
    })
    .filter((reward): reward is RainbowReward => reward !== null);
}
