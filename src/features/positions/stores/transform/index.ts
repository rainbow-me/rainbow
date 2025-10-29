import {
  type RainbowPositions,
  type RainbowPosition,
  type RainbowUnderlyingAsset,
  type RainbowDeposit,
  type RainbowPool,
  type RainbowStake,
  type RainbowBorrow,
  type RainbowReward,
  type PositionsTotals,
} from '../../types';
import {
  DetailType,
  type ListPositionsResponse,
  type Position,
  type PortfolioItem,
  type PositionToken,
  type ExtendedStats,
  type EnhancedStats,
} from '../../types/generated/positions/positions';
import type { PositionsParams } from '../fetcher';
import { shouldFilterPortfolioItem, shouldFilterPosition, shouldFilterUnderlyingAsset } from './filter';
import { sortPositions } from './sort';
import { normalizeDappName } from './utils/dapp';
import { isConcentratedLiquidityProtocol, calculateLiquidityRangeStatus, calculateLiquidityAllocation } from './utils/lp';
import { normalizeDate, normalizeDateTime } from './utils/date';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import type { NativeCurrencyKey } from '@/entities';

// ============ Helpers ===================================================== //

/**
 * Create { amount, display } from a string amount
 */
function getNativeValue(amount: string, currency: NativeCurrencyKey): { amount: string; display: string } {
  return {
    amount,
    display: convertAmountToNativeDisplay(amount, currency),
  };
}

/**
 * Validate and transform description into display name
 * Returns undefined if description is empty or starts with '#'
 *
 * Note: Descriptions starting with '#' are internal token IDs (e.g., '#123456')
 * used by protocols for tracking purposes. These are not user-friendly and should
 * not be displayed in the UI. Instead, we fall back to showing token symbols.
 */
function getDisplayNameFromDescription(description?: string): string | undefined {
  if (!description || description === '' || description.startsWith('#')) {
    return undefined;
  }
  return description;
}

// ============ Stats Transforms ============================================ //

/**
 * Transform backend ExtendedStats to Rainbow PositionsTotals
 */
function transformExtendedStats(stats: ExtendedStats | undefined, currency: NativeCurrencyKey): PositionsTotals {
  if (!stats) {
    const zero = getNativeValue('0', currency);
    return {
      total: zero,
      totalDeposits: zero,
      totalBorrows: zero,
      totalRewards: zero,
      totalLocked: zero,
    };
  }

  return {
    total: getNativeValue(stats.netTotal, currency),
    totalDeposits: getNativeValue(stats.totalDeposits, currency),
    totalBorrows: getNativeValue(stats.totalBorrows, currency),
    totalRewards: getNativeValue(stats.totalRewards, currency),
    totalLocked: getNativeValue(stats.totalLocked, currency),
  };
}

// ============ RainbowUnderlyingAsset Transforms ===== //

/**
 * Transform DeBank position tokens into underlying assets with native display values
 */
function transformUnderlyingAssets(tokens: PositionToken[] | undefined, currency: NativeCurrencyKey): RainbowUnderlyingAsset[] {
  if (!tokens || tokens.length === 0) {
    return [];
  }

  return tokens.reduce<RainbowUnderlyingAsset[]>((acc, token) => {
    if (!token.asset) return acc;

    if (shouldFilterUnderlyingAsset(token)) {
      return acc;
    }

    const { price, creationDate, iconUrl, ...asset } = token.asset;

    acc.push({
      asset: {
        ...asset,
        // Avoiding getUniqueId to reduce worklet native module mocking
        uniqueId: `${asset.address}_${asset.chainId}`,
        icon_url: iconUrl,
        // Normalize Go date format and filter out Go zero time
        creationDate: normalizeDate(creationDate),
        price: price
          ? {
              value: price.value,
              // Filter out Go zero time and convert to timestamp
              changed_at: normalizeDateTime(price.changedAt),
              relative_change_24h: price.relativeChange24h,
            }
          : undefined,
      },
      quantity: token.amount,
      value: getNativeValue(token.assetValue, currency),
    });

    return acc;
  }, []);
}

// ============ Category Transforms ========================================= //

/**
 * Transform DeBank supply tokens into deposit items
 */
function transformDeposits(
  tokens: PositionToken[],
  item: PortfolioItem,
  position: Position,
  currency: NativeCurrencyKey
): RainbowDeposit[] {
  return transformUnderlyingAssets(tokens, currency).map(token => ({
    asset: token.asset,
    quantity: token.quantity,
    value: token.value,
    underlying: [token],
    dappVersion: position.protocolVersion,
    poolAddress: item.pool?.id,
  }));
}

/**
 * Transform DeBank LP supply tokens into pool items with range/allocation data
 */
function transformPools(tokens: PositionToken[], item: PortfolioItem, position: Position, currency: NativeCurrencyKey): RainbowPool[] {
  const underlying = transformUnderlyingAssets(tokens, currency);
  if (underlying.length === 0) return [];

  underlying.sort((a, b) => {
    const valueA = parseFloat(a.value?.amount || '0');
    const valueB = parseFloat(b.value?.amount || '0');
    return valueB - valueA;
  });

  const concentrated = isConcentratedLiquidityProtocol(position.protocolName, position.canonicalProtocolName, position.protocolVersion);

  return [
    {
      asset: underlying[0].asset,
      quantity: tokens[0]?.amount || '0',
      poolAddress: item.pool?.id,
      isConcentratedLiquidity: concentrated,
      rangeStatus: calculateLiquidityRangeStatus(underlying, concentrated),
      allocation: calculateLiquidityAllocation(underlying),
      value: getNativeValue(item.stats?.assetValue || '0', currency),
      underlying,
      dappVersion: position.protocolVersion,
    },
  ];
}

/**
 * Transform DeBank multi-token stakes into LP stake items with range/allocation
 */
function transformLpStakes(
  tokens: PositionToken[],
  item: PortfolioItem,
  position: Position,
  currency: NativeCurrencyKey,
  isLocked: boolean
): RainbowStake[] {
  const underlying = transformUnderlyingAssets(tokens, currency);
  if (underlying.length === 0) return [];

  // Sort by value (highest first) for consistent display
  underlying.sort((a, b) => {
    const valueA = parseFloat(a.value?.amount || '0');
    const valueB = parseFloat(b.value?.amount || '0');
    return valueB - valueA;
  });

  const concentrated = isConcentratedLiquidityProtocol(position.protocolName, position.canonicalProtocolName, position.protocolVersion);
  const rangeStatus = calculateLiquidityRangeStatus(underlying, concentrated);
  const allocation = calculateLiquidityAllocation(underlying);

  return [
    {
      asset: underlying[0].asset,
      quantity: tokens[0]?.amount || '0',
      poolAddress: item.pool?.id,
      isLp: true,
      isConcentratedLiquidity: concentrated,
      rangeStatus,
      allocation,
      isLocked,
      value: getNativeValue(item.stats?.assetValue || '0', currency),
      underlying,
      dappVersion: position.protocolVersion,
    },
  ];
}

/**
 * Transform DeBank stake tokens into stake items (single token only)
 */
function transformStakes(
  tokens: PositionToken[],
  item: PortfolioItem,
  position: Position,
  currency: NativeCurrencyKey,
  isLocked: boolean
): RainbowStake[] {
  return transformUnderlyingAssets(tokens, currency).map(token => ({
    asset: token.asset,
    quantity: token.quantity,
    value: token.value,
    underlying: [token],
    dappVersion: position.protocolVersion,
    poolAddress: item.pool?.id,
    isLp: false,
    isLocked,
  }));
}

/**
 * Transform DeBank borrow tokens into borrow items
 */
function transformBorrows(tokens: PositionToken[], item: PortfolioItem, position: Position, currency: NativeCurrencyKey): RainbowBorrow[] {
  return transformUnderlyingAssets(tokens, currency).map(token => ({
    asset: token.asset,
    quantity: token.quantity,
    value: token.value,
    underlying: [token],
    dappVersion: position.protocolVersion,
    poolAddress: item.pool?.id,
  }));
}

/**
 * Transform DeBank reward tokens into claimable reward items
 */
function transformRewards(tokens: PositionToken[], item: PortfolioItem, position: Position, currency: NativeCurrencyKey): RainbowReward[] {
  const underlyingAssets = transformUnderlyingAssets(tokens, currency);

  return underlyingAssets.map(underlyingAsset => ({
    asset: underlyingAsset.asset,
    quantity: underlyingAsset.quantity,
    value: underlyingAsset.value,
    underlying: [],
    dappVersion: position.protocolVersion,
  }));
}

// ============ DeBank DetailType Transforms =============================== //

/**
 * Transform COMMON detail type
 * - Deposits/Pools: supplyTokenList (LP if multi-token)
 * - Borrows: borrowTokenList
 * - Rewards: rewardTokenList
 * - Extra fields: description
 */
function transformCommonDetail(
  item: PortfolioItem,
  sourcePosition: Position,
  currency: NativeCurrencyKey
): {
  deposits: RainbowDeposit[];
  pools: RainbowPool[];
  stakes: RainbowStake[];
  borrows: RainbowBorrow[];
  rewards: RainbowReward[];
} {
  const detail = item.detail;
  if (!detail) {
    return { deposits: [], pools: [], stakes: [], borrows: [], rewards: [] };
  }
  const result: {
    deposits: RainbowDeposit[];
    pools: RainbowPool[];
    stakes: RainbowStake[];
    borrows: RainbowBorrow[];
    rewards: RainbowReward[];
  } = {
    deposits: [],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
  };

  // Supply tokens: LP if multiple, deposit if single
  if (detail.supplyTokenList?.length) {
    if (detail.supplyTokenList.length > 1) {
      result.pools = transformPools(detail.supplyTokenList, item, sourcePosition, currency).map(pool => ({
        ...pool,
        name: getDisplayNameFromDescription(detail.description),
      }));
    } else {
      result.deposits = transformDeposits(detail.supplyTokenList, item, sourcePosition, currency).map(deposit => ({
        ...deposit,
        name: getDisplayNameFromDescription(detail.description),
      }));
    }
  }

  if (detail.borrowTokenList?.length) {
    result.borrows = transformBorrows(detail.borrowTokenList, item, sourcePosition, currency).map(borrow => ({
      ...borrow,
      name: getDisplayNameFromDescription(detail.description),
    }));
  }

  if (detail.rewardTokenList?.length) {
    result.rewards = transformRewards(detail.rewardTokenList, item, sourcePosition, currency).map(reward => ({
      ...reward,
      name: getDisplayNameFromDescription(detail.description),
    }));
  }

  return result;
}

/**
 * Transform LENDING detail type
 * - Deposits: supplyTokenList (always single-token)
 * - Borrows: borrowTokenList
 * - Rewards: rewardTokenList
 * - Extra fields: healthRate
 */
function transformLendingDetail(
  item: PortfolioItem,
  sourcePosition: Position,
  currency: NativeCurrencyKey
): {
  deposits: RainbowDeposit[];
  pools: RainbowPool[];
  stakes: RainbowStake[];
  borrows: RainbowBorrow[];
  rewards: RainbowReward[];
} {
  const detail = item.detail;
  if (!detail) {
    return { deposits: [], pools: [], stakes: [], borrows: [], rewards: [] };
  }
  const result: {
    deposits: RainbowDeposit[];
    pools: RainbowPool[];
    stakes: RainbowStake[];
    borrows: RainbowBorrow[];
    rewards: RainbowReward[];
  } = {
    deposits: [],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
  };

  if (detail.supplyTokenList?.length) {
    result.deposits = transformDeposits(detail.supplyTokenList, item, sourcePosition, currency).map(deposit => ({
      ...deposit,
      healthRate: detail.healthRate,
    }));
  }

  if (detail.borrowTokenList?.length) {
    result.borrows = transformBorrows(detail.borrowTokenList, item, sourcePosition, currency).map(borrow => ({
      ...borrow,
      healthRate: detail.healthRate,
    }));
  }

  if (detail.rewardTokenList?.length) {
    result.rewards = transformRewards(detail.rewardTokenList, item, sourcePosition, currency).map(reward => ({
      ...reward,
      healthRate: detail.healthRate,
    }));
  }

  return result;
}

/**
 * Transform LEVERAGED_FARMING detail type
 * - Stakes: supplyTokenList (LP if multi-token)
 * - Borrows: borrowTokenList
 * - Rewards: rewardTokenList
 * - Extra fields: debtRatio
 */
function transformLeveragedFarmingDetail(
  item: PortfolioItem,
  sourcePosition: Position,
  currency: NativeCurrencyKey
): {
  deposits: RainbowDeposit[];
  pools: RainbowPool[];
  stakes: RainbowStake[];
  borrows: RainbowBorrow[];
  rewards: RainbowReward[];
} {
  const detail = item.detail;
  if (!detail) {
    return { deposits: [], pools: [], stakes: [], borrows: [], rewards: [] };
  }
  const result: {
    deposits: RainbowDeposit[];
    pools: RainbowPool[];
    stakes: RainbowStake[];
    borrows: RainbowBorrow[];
    rewards: RainbowReward[];
  } = {
    deposits: [],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
  };

  if (detail.supplyTokenList?.length) {
    if (detail.supplyTokenList.length > 1) {
      result.stakes = transformLpStakes(detail.supplyTokenList, item, sourcePosition, currency, false).map(stake => ({
        ...stake,
        debtRatio: detail.debtRatio,
      }));
    } else {
      result.stakes = transformStakes(detail.supplyTokenList, item, sourcePosition, currency, false).map(stake => ({
        ...stake,
        debtRatio: detail.debtRatio,
      }));
    }
  }

  if (detail.borrowTokenList?.length) {
    result.borrows = transformBorrows(detail.borrowTokenList, item, sourcePosition, currency).map(borrow => ({
      ...borrow,
      debtRatio: detail.debtRatio,
    }));
  }

  if (detail.rewardTokenList?.length) {
    result.rewards = transformRewards(detail.rewardTokenList, item, sourcePosition, currency).map(reward => ({
      ...reward,
      debtRatio: detail.debtRatio,
    }));
  }

  return result;
}

/**
 * Transform LOCKED detail type
 * - Stakes: supplyTokenList (LP if multi-token, isLocked=true)
 * - Rewards: rewardTokenList
 * - Extra fields: description, unlockAt
 */
function transformLockedDetail(
  item: PortfolioItem,
  sourcePosition: Position,
  currency: NativeCurrencyKey
): {
  deposits: RainbowDeposit[];
  pools: RainbowPool[];
  stakes: RainbowStake[];
  borrows: RainbowBorrow[];
  rewards: RainbowReward[];
} {
  const detail = item.detail;
  if (!detail) {
    return { deposits: [], pools: [], stakes: [], borrows: [], rewards: [] };
  }
  const result: {
    deposits: RainbowDeposit[];
    pools: RainbowPool[];
    stakes: RainbowStake[];
    borrows: RainbowBorrow[];
    rewards: RainbowReward[];
  } = {
    deposits: [],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
  };

  if (detail.supplyTokenList?.length) {
    if (detail.supplyTokenList.length > 1) {
      result.stakes = transformLpStakes(detail.supplyTokenList, item, sourcePosition, currency, true).map(stake => ({
        ...stake,
        name: getDisplayNameFromDescription(detail.description),
        unlockAt: detail.unlockTime,
      }));
    } else {
      result.stakes = transformStakes(detail.supplyTokenList, item, sourcePosition, currency, true).map(stake => ({
        ...stake,
        name: getDisplayNameFromDescription(detail.description),
        unlockAt: detail.unlockTime,
      }));
    }
  }

  if (detail.rewardTokenList?.length) {
    result.rewards = transformRewards(detail.rewardTokenList, item, sourcePosition, currency).map(reward => ({
      ...reward,
      name: getDisplayNameFromDescription(detail.description),
      unlockAt: detail.unlockTime,
    }));
  }

  return result;
}

/**
 * Transform REWARD detail type
 * - Rewards: tokenList
 */
function transformRewardDetail(
  item: PortfolioItem,
  sourcePosition: Position,
  currency: NativeCurrencyKey
): {
  deposits: RainbowDeposit[];
  pools: RainbowPool[];
  stakes: RainbowStake[];
  borrows: RainbowBorrow[];
  rewards: RainbowReward[];
} {
  const detail = item.detail;
  if (!detail) {
    return { deposits: [], pools: [], stakes: [], borrows: [], rewards: [] };
  }
  const result: {
    deposits: RainbowDeposit[];
    pools: RainbowPool[];
    stakes: RainbowStake[];
    borrows: RainbowBorrow[];
    rewards: RainbowReward[];
  } = {
    deposits: [],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
  };

  if (detail.tokenList?.length) {
    result.rewards = transformRewards(detail.tokenList, item, sourcePosition, currency);
  }

  return result;
}

/**
 * Transform VESTING detail type
 * - Rewards: tokenList or rewardTokenList
 */
function transformVestingDetail(
  item: PortfolioItem,
  sourcePosition: Position,
  currency: NativeCurrencyKey
): {
  deposits: RainbowDeposit[];
  pools: RainbowPool[];
  stakes: RainbowStake[];
  borrows: RainbowBorrow[];
  rewards: RainbowReward[];
} {
  const detail = item.detail;
  if (!detail) {
    return { deposits: [], pools: [], stakes: [], borrows: [], rewards: [] };
  }
  const result: {
    deposits: RainbowDeposit[];
    pools: RainbowPool[];
    stakes: RainbowStake[];
    borrows: RainbowBorrow[];
    rewards: RainbowReward[];
  } = {
    deposits: [],
    pools: [],
    stakes: [],
    borrows: [],
    rewards: [],
  };

  // Vesting can have tokenList or rewardTokenList
  const tokens = detail.tokenList || detail.rewardTokenList;
  if (tokens?.length) {
    result.rewards = transformRewards(tokens, item, sourcePosition, currency);
  }

  return result;
}

/**
 * Transform a portfolio item by routing to the appropriate detail type handler
 * Returns empty arrays if item should be filtered or has no valid detail type
 */
function transformPortfolioItem(
  item: PortfolioItem,
  sourcePosition: Position,
  currency: NativeCurrencyKey
): {
  deposits: RainbowDeposit[];
  pools: RainbowPool[];
  stakes: RainbowStake[];
  borrows: RainbowBorrow[];
  rewards: RainbowReward[];
} {
  // Early filtering
  if (shouldFilterPortfolioItem(item)) {
    return { deposits: [], pools: [], stakes: [], borrows: [], rewards: [] };
  }

  const detail = item.detail;
  if (!detail) {
    return { deposits: [], pools: [], stakes: [], borrows: [], rewards: [] };
  }

  // Get effective detail type (last element = highest priority)
  const detailTypes = item.detailTypes ?? [];
  const effectiveDetailType = detailTypes[detailTypes.length - 1];

  // Skip if no valid detail type
  if (!effectiveDetailType || effectiveDetailType === DetailType.UNSPECIFIED) {
    return { deposits: [], pools: [], stakes: [], borrows: [], rewards: [] };
  }

  // Route to appropriate detail type handler
  switch (effectiveDetailType) {
    case DetailType.COMMON:
      return transformCommonDetail(item, sourcePosition, currency);
    case DetailType.LENDING:
      return transformLendingDetail(item, sourcePosition, currency);
    case DetailType.LEVERAGED_FARMING:
      return transformLeveragedFarmingDetail(item, sourcePosition, currency);
    case DetailType.LOCKED:
      return transformLockedDetail(item, sourcePosition, currency);
    case DetailType.REWARD:
      return transformRewardDetail(item, sourcePosition, currency);
    case DetailType.VESTING:
      return transformVestingDetail(item, sourcePosition, currency);
    default:
      return { deposits: [], pools: [], stakes: [], borrows: [], rewards: [] };
  }
}

// ============ Protocol Grouping =========================================== //

/**
 * Group DeBank positions by canonical protocol name and aggregate cross-chain data
 * Adjusts totals to account for filtered items
 */
function groupByProtocol(
  positions: Position[],
  stats: EnhancedStats | undefined,
  currency: NativeCurrencyKey
): { grouped: Record<string, RainbowPosition>; totalFilteredValue: number } {
  const grouped: Record<string, RainbowPosition> = {};
  let totalFilteredValue = 0;

  positions.forEach(position => {
    const canonicalName = position.canonicalProtocolName;

    if (!grouped[canonicalName]) {
      const protocol = position.protocolVersion ? `${canonicalName}-${position.protocolVersion.toLowerCase()}` : canonicalName;

      grouped[canonicalName] = {
        type: canonicalName,
        protocol,
        protocolVersion: position.protocolVersion,
        deposits: [],
        pools: [],
        stakes: [],
        borrows: [],
        rewards: [],
        totals: transformExtendedStats(stats?.canonicalProtocol?.[canonicalName]?.totals, currency),
        dapp: {
          name: normalizeDappName(position.dapp?.name || position.canonicalProtocolName),
          url: position.dapp?.url || '',
          icon_url: position.dapp?.iconUrl || '',
          colors: position.dapp?.colors || { primary: '#000000', fallback: '#808080', shadow: '#000000' },
        },
      };
    }

    const rainbowPosition = grouped[canonicalName];

    if (position.protocolVersion && !rainbowPosition.protocolVersion) {
      rainbowPosition.protocolVersion = position.protocolVersion;
    }

    let positionFilteredValue = 0;

    position.portfolioItems.forEach(item => {
      // Track filtered value before transforming
      if (shouldFilterPortfolioItem(item)) {
        positionFilteredValue += parseFloat(item.stats?.netValue || '0');
      }

      const transformed = transformPortfolioItem(item, position, currency);
      rainbowPosition.deposits = rainbowPosition.deposits.concat(transformed.deposits);
      rainbowPosition.pools = rainbowPosition.pools.concat(transformed.pools);
      rainbowPosition.stakes = rainbowPosition.stakes.concat(transformed.stakes);
      rainbowPosition.borrows = rainbowPosition.borrows.concat(transformed.borrows);
      rainbowPosition.rewards = rainbowPosition.rewards.concat(transformed.rewards);
    });

    // Adjust position total for filtered items
    if (positionFilteredValue > 0) {
      const currentTotal = parseFloat(rainbowPosition.totals.total.amount);
      rainbowPosition.totals.total = getNativeValue((currentTotal - positionFilteredValue).toString(), currency);
    }

    totalFilteredValue += positionFilteredValue;
  });

  return {
    grouped: Object.fromEntries(Object.entries(grouped).filter(([, position]) => !shouldFilterPosition(position))),
    totalFilteredValue,
  };
}

// ============ Main Transform ============================================== //

/**
 * Transform DeBank API response into Rainbow positions format
 * Groups by protocol, calculates totals, applies filters, and sorts by value
 * Adjusts grand totals to account for filtered items
 */
export function transformPositions(response: ListPositionsResponse, params: PositionsParams): RainbowPositions {
  const { currency } = params;

  if (!response?.result?.positions || response.result.positions.length === 0) {
    const zero = getNativeValue('0', currency);
    return {
      positions: {},
      totals: {
        total: zero,
        totalDeposits: zero,
        totalBorrows: zero,
        totalRewards: zero,
        totalLocked: zero,
      },
    };
  }

  const { grouped, totalFilteredValue } = groupByProtocol(response.result.positions, response.result.stats, currency);
  const sorted = sortPositions(grouped);
  const grandTotals = transformExtendedStats(response.result.stats?.totals, currency);

  // Adjust grand total for filtered items
  if (totalFilteredValue > 0) {
    const adjusted = parseFloat(grandTotals.total.amount) - totalFilteredValue;
    grandTotals.total = getNativeValue(adjusted.toString(), currency);
  }

  return {
    positions: sorted,
    totals: grandTotals,
  };
}
