import {
  PositionName,
  type ListPositionsResponse,
  type RainbowPositions,
  type ProtocolGroup,
  type Position,
  type PortfolioItem,
  type PositionToken,
  type CategoryResult,
  type RainbowUnderlyingAsset,
  type PositionAsset,
  type RainbowDeposit,
  type RainbowPool,
  type RainbowStake,
  type RainbowBorrow,
  type RainbowReward,
} from '../../types';
import type { PositionsParams } from '../fetcher';
import { filterPositions } from './filter';
import { sortPositions } from './sort';
import { normalizeDappName } from './utils/dapp';
import { calculatePositionTotals, calculateGrandTotals, calculateTotalValue, calculateTokenNativeDisplay } from './utils/totals';
import { isConcentratedLiquidityProtocol, calculateLiquidityRangeStatus, calculateLiquidityAllocation } from './utils/lp';
import { normalizeDate, normalizeDateTime } from './utils/date';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { NativeCurrencyKey } from '@/entities';

// ============ Constants ====================================================== //

const UNSUPPORTED_POSITION_TYPES: readonly (PositionName | string)[] = [
  PositionName.PERPETUALS,
  PositionName.OPTIONS_BUYER,
  PositionName.OPTIONS_SELLER,
  PositionName.INSURANCE_BUYER,
  PositionName.INSURANCE_SELLER,
];

// ============ Helpers ======================================================== //

/**
 * Check if a DeBank position type should be filtered out
 */
function shouldFilterPositionType(positionName: PositionName | string): boolean {
  return UNSUPPORTED_POSITION_TYPES.includes(positionName);
}

// ============ Asset Building ================================================= //

/**
 * Transform DeBank position tokens into underlying assets with native display values
 */
function transformUnderlyingAssets(tokens: PositionToken[] | undefined, currency: string): RainbowUnderlyingAsset[] {
  if (!tokens || tokens.length === 0) {
    return [];
  }

  return tokens
    .map(token => {
      if (!token.asset) return null;

      return {
        asset: {
          ...token.asset,
          chain_id: token.asset.chainId,
          icon_url: token.asset.iconUrl,
          // Normalize Go date format and filter out Go zero time
          creationDate: normalizeDate(token.asset.creationDate),
          price: token.asset.price
            ? {
                ...token.asset.price,
                // Filter out Go zero time Date objects and convert to timestamp
                changed_at: normalizeDateTime(token.asset.price.changedAt),
                relative_change_24h: token.asset.price.relativeChange24h || 0,
              }
            : undefined,
        } as PositionAsset,
        quantity: token.amount || '0',
        native: calculateTokenNativeDisplay(token, currency),
      };
    })
    .filter((asset): asset is RainbowUnderlyingAsset => asset !== null);
}

// ============ Category Mapping =============================================== //

/**
 * Map DeBank portfolio item to category buckets based on position type
 */
function mapPortfolioItemsToCategories(item: PortfolioItem): CategoryResult {
  const result: CategoryResult = {
    supplyTokens: [],
    stakeTokens: [],
    borrowTokens: [],
    rewardTokens: [],
  };

  const detail = item.detail;
  if (!detail) {
    return result;
  }

  switch (item.name) {
    case PositionName.DEPOSIT:
      result.supplyTokens = detail.supplyTokenList || [];
      break;

    case PositionName.LENDING:
      result.supplyTokens = detail.supplyTokenList || [];
      result.borrowTokens = detail.borrowTokenList || [];
      result.rewardTokens = detail.rewardTokenList || [];
      break;

    case PositionName.LIQUIDITY_POOL:
      result.supplyTokens = detail.supplyTokenList || [];
      result.rewardTokens = detail.rewardTokenList || [];
      break;

    case PositionName.STAKED:
    case PositionName.LOCKED:
      result.stakeTokens = detail.supplyTokenList || [];
      break;

    case PositionName.REWARDS:
    case PositionName.VESTING:
      result.rewardTokens = detail.rewardTokenList || detail.tokenList || [];
      break;

    case PositionName.FARMING:
      result.stakeTokens = detail.supplyTokenList || [];
      result.rewardTokens = detail.rewardTokenList || [];
      break;

    case PositionName.YIELD:
      result.supplyTokens = detail.supplyTokenList || [];
      result.borrowTokens = detail.borrowTokenList || [];
      result.rewardTokens = detail.rewardTokenList || [];
      break;

    case PositionName.INVESTMENT:
      result.supplyTokens = detail.supplyTokenList || [];
      break;

    case PositionName.LEVERAGED_FARMING:
      result.supplyTokens = detail.supplyTokenList || [];
      result.borrowTokens = detail.borrowTokenList || [];
      result.rewardTokens = detail.rewardTokenList || [];
      break;

    default:
      break;
  }

  return result;
}

// ============ Item Transformation ============================================ //

/**
 * Transform DeBank supply tokens into deposit items
 */
function transformDeposits(tokens: PositionToken[], item: PortfolioItem, position: Position, currency: string): RainbowDeposit[] {
  return transformUnderlyingAssets(tokens, currency).map(token => ({
    asset: token.asset,
    quantity: token.quantity,
    pool_address: item.pool?.id,
    isConcentratedLiquidity: false,
    totalValue: calculateTotalValue([token]),
    underlying: [token],
    dappVersion: position.protocolVersion,
  }));
}

/**
 * Transform DeBank LP supply tokens into pool items with range/allocation data
 */
function transformPools(tokens: PositionToken[], item: PortfolioItem, position: Position, currency: string): RainbowPool[] {
  const underlying = transformUnderlyingAssets(tokens, currency);
  if (underlying.length === 0) return [];

  underlying.sort((a, b) => {
    const valueA = parseFloat(a.native?.amount || '0');
    const valueB = parseFloat(b.native?.amount || '0');
    return valueB - valueA;
  });

  const concentrated = isConcentratedLiquidityProtocol(position.protocolName, position.canonicalProtocolName, position.protocolVersion);

  return [
    {
      asset: underlying[0].asset,
      quantity: tokens[0]?.amount || '0',
      pool_address: item.pool?.id,
      isConcentratedLiquidity: concentrated,
      rangeStatus: calculateLiquidityRangeStatus(underlying, concentrated),
      allocation: calculateLiquidityAllocation(underlying),
      totalValue: calculateTotalValue(underlying),
      underlying,
      dappVersion: position.protocolVersion,
    },
  ];
}

/**
 * Transform DeBank multi-token stakes into LP stake items with range/allocation
 */
function transformLpStakes(tokens: PositionToken[], item: PortfolioItem, position: Position, currency: string): RainbowStake[] {
  const underlying = transformUnderlyingAssets(tokens, currency);
  if (underlying.length === 0) return [];

  // Sort by value (highest first) for consistent display
  underlying.sort((a, b) => {
    const valueA = parseFloat(a.native?.amount || '0');
    const valueB = parseFloat(b.native?.amount || '0');
    return valueB - valueA;
  });

  const concentrated = isConcentratedLiquidityProtocol(position.protocolName, position.canonicalProtocolName, position.protocolVersion);
  const rangeStatus = calculateLiquidityRangeStatus(underlying, concentrated);
  const allocation = calculateLiquidityAllocation(underlying);

  return [
    {
      asset: underlying[0].asset,
      quantity: tokens[0]?.amount || '0',
      pool_address: item.pool?.id,
      isLp: true,
      isConcentratedLiquidity: concentrated,
      rangeStatus,
      allocation,
      isLocked: item.name === PositionName.LOCKED,
      totalValue: calculateTotalValue(underlying),
      underlying,
      dappVersion: position.protocolVersion,
    },
  ];
}

/**
 * Transform DeBank stake tokens into stake items (LP or single token)
 */
function transformStakes(tokens: PositionToken[], item: PortfolioItem, position: Position, currency: string): RainbowStake[] {
  // Handle LP stakes (multiple tokens) - all LP stakes need rangeStatus/allocation for proper rendering
  if (tokens.length > 1) {
    return transformLpStakes(tokens, item, position, currency);
  }

  // Handle single token stakes (includes farming)
  return transformUnderlyingAssets(tokens, currency).map(token => ({
    asset: token.asset,
    quantity: token.quantity,
    pool_address: item.pool?.id,
    isLp: false,
    isConcentratedLiquidity: false,
    isLocked: item.name === PositionName.LOCKED,
    totalValue: calculateTotalValue([token]),
    underlying: [token],
    dappVersion: position.protocolVersion,
  }));
}

/**
 * Transform DeBank borrow tokens into borrow items
 */
function transformBorrows(tokens: PositionToken[], item: PortfolioItem, position: Position, currency: string): RainbowBorrow[] {
  return transformUnderlyingAssets(tokens, currency).map(token => ({
    asset: token.asset,
    quantity: token.quantity,
    pool_address: item.pool?.id,
    totalValue: calculateTotalValue([token]),
    underlying: [token],
    dappVersion: position.protocolVersion,
  }));
}

/**
 * Transform DeBank reward tokens into claimable reward items
 */
function transformRewards(tokens: PositionToken[], item: PortfolioItem, position: Position, currency: string): RainbowReward[] {
  return transformUnderlyingAssets(tokens, currency).map(token => ({
    asset: token.asset,
    quantity: token.quantity,
    totalValue: token.native.amount,
    native: token.native,
    dappVersion: position.protocolVersion,
  }));
}

/**
 * Transform categorized tokens into typed position items (deposits, pools, stakes, borrows, rewards)
 */
function transformCategories(
  categories: CategoryResult,
  item: PortfolioItem,
  sourcePosition: Position,
  currency: string
): {
  deposits: RainbowDeposit[];
  pools: RainbowPool[];
  stakes: RainbowStake[];
  borrows: RainbowBorrow[];
  rewards: RainbowReward[];
} {
  const deposits: RainbowDeposit[] = [];
  const pools: RainbowPool[] = [];
  const stakes: RainbowStake[] = [];
  const borrows: RainbowBorrow[] = [];
  const rewards: RainbowReward[] = [];

  if (categories.supplyTokens?.length) {
    if (item.name === PositionName.LIQUIDITY_POOL) {
      pools.push(...transformPools(categories.supplyTokens, item, sourcePosition, currency));
    } else {
      deposits.push(...transformDeposits(categories.supplyTokens, item, sourcePosition, currency));
    }
  }

  if (categories.stakeTokens?.length) {
    stakes.push(...transformStakes(categories.stakeTokens, item, sourcePosition, currency));
  }

  if (categories.borrowTokens?.length) {
    borrows.push(...transformBorrows(categories.borrowTokens, item, sourcePosition, currency));
  }

  if (categories.rewardTokens?.length) {
    rewards.push(...transformRewards(categories.rewardTokens, item, sourcePosition, currency));
  }

  return { deposits, pools, stakes, borrows, rewards };
}

// ============ Protocol Grouping ============================================== //

/**
 * Group DeBank positions by canonical protocol name and aggregate cross-chain data
 */
function groupByProtocol(positions: Position[], currency: string): ProtocolGroup {
  const grouped: ProtocolGroup = {};
  const emptyDisplay = convertAmountToNativeDisplay('0', currency as NativeCurrencyKey);

  positions.forEach(position => {
    const canonicalName = position.canonicalProtocolName;

    if (!grouped[canonicalName]) {
      grouped[canonicalName] = {
        type: canonicalName,
        protocol_version: position.protocolVersion,
        chainIds: [],
        deposits: [],
        pools: [],
        stakes: [],
        borrows: [],
        rewards: [],
        totals: {
          total: {
            amount: '0',
            display: emptyDisplay,
          },
          totalDeposits: {
            amount: '0',
            display: emptyDisplay,
          },
          totalBorrows: {
            amount: '0',
            display: emptyDisplay,
          },
          totalRewards: {
            amount: '0',
            display: emptyDisplay,
          },
          totalLocked: {
            amount: '0',
            display: emptyDisplay,
          },
        },
        dapp: {
          name: normalizeDappName(position.dapp?.name || position.canonicalProtocolName),
          url: position.dapp?.url || '',
          icon_url: position.dapp?.iconUrl || '',
          colors: position.dapp?.colors || { primary: '#000000', fallback: '#808080', shadow: '#000000' },
        },
      };
    }

    const rainbowPosition = grouped[canonicalName];

    if (!rainbowPosition.chainIds.includes(position.chainId)) {
      rainbowPosition.chainIds.push(position.chainId);
      rainbowPosition.chainIds.sort((a, b) => a - b);
    }

    if (position.protocolVersion && !rainbowPosition.protocol_version) {
      rainbowPosition.protocol_version = position.protocolVersion;
    }

    if (position.dapp && (!rainbowPosition.dapp.icon_url || position.dapp.iconUrl)) {
      rainbowPosition.dapp = {
        name: normalizeDappName(position.dapp.name || canonicalName),
        url: position.dapp.url || '',
        icon_url: position.dapp.iconUrl || '',
        colors: position.dapp.colors || { primary: '#000000', fallback: '#808080', shadow: '#000000' },
      };
    }

    position.portfolioItems.forEach(item => {
      if (shouldFilterPositionType(item.name)) {
        return;
      }

      const categories = mapPortfolioItemsToCategories(item);
      const processed = transformCategories(categories, item, position, currency);

      rainbowPosition.deposits.push(...processed.deposits);
      rainbowPosition.pools.push(...processed.pools);
      rainbowPosition.stakes.push(...processed.stakes);
      rainbowPosition.borrows.push(...processed.borrows);
      rainbowPosition.rewards.push(...processed.rewards);
    });
  });

  return grouped;
}

// ============ Main Transform ================================================= //

/**
 * Transform DeBank API response into Rainbow positions format
 * Groups by protocol, calculates totals, applies filters, and sorts by value
 */
export function transformPositions(response: ListPositionsResponse, params: PositionsParams): RainbowPositions {
  const { currency } = params;
  const emptyDisplay = convertAmountToNativeDisplay('0', currency as NativeCurrencyKey);

  if (!response?.result?.positions || response.result.positions.length === 0) {
    return {
      positions: {},
      positionTokens: [],
      totals: {
        total: {
          amount: '0',
          display: emptyDisplay,
        },
        totalDeposits: {
          amount: '0',
          display: emptyDisplay,
        },
        totalBorrows: {
          amount: '0',
          display: emptyDisplay,
        },
        totalRewards: {
          amount: '0',
          display: emptyDisplay,
        },
        totalLocked: {
          amount: '0',
          display: emptyDisplay,
        },
      },
    };
  }

  const grouped = groupByProtocol(response.result.positions, currency);

  Object.values(grouped).forEach(position => {
    calculatePositionTotals(position, currency);
  });

  const filtered = filterPositions(grouped);
  const sorted = sortPositions(filtered);

  const positionsRecord = Object.fromEntries(sorted.map(position => [position.type, position]));
  const grandTotals = calculateGrandTotals(sorted, currency);

  return {
    positions: positionsRecord,
    positionTokens: response.result.uniqueTokens || [],
    totals: grandTotals,
  };
}
