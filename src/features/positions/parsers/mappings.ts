import { PositionName, type PortfolioItem, type CategoryResult } from '../types';
import { logger } from '@/logger';

/**
 * Map PortfolioItem to UI categories based on position type
 */
export function mapPortfolioItemToCategories(item: PortfolioItem): CategoryResult {
  const result: CategoryResult = {
    supplyTokens: [],
    stakeTokens: [],
    borrowTokens: [],
    rewardTokens: [],
  };

  // Use the detail structure for token lists
  const detail = item.detail;
  if (!detail) {
    return result;
  }

  // Process based on position type (handle both numeric and string enums)
  switch (item.name) {
    // Lending/Supply positions
    case PositionName.DEPOSIT:
      result.supplyTokens = detail.supplyTokenList || [];
      break;

    // Lending positions (can have both supply and borrow)
    case PositionName.LENDING:
      result.supplyTokens = detail.supplyTokenList || [];
      result.borrowTokens = detail.borrowTokenList || [];
      result.rewardTokens = detail.rewardTokenList || [];
      break;

    // LP positions (can have claimable fees as rewards)
    case PositionName.LIQUIDITY_POOL:
      result.supplyTokens = detail.supplyTokenList || [];
      result.rewardTokens = detail.rewardTokenList || [];
      break;

    // Staking positions
    case PositionName.STAKED:
    case PositionName.LOCKED:
      result.stakeTokens = detail.supplyTokenList || [];
      break;

    // Reward/Vesting positions
    case PositionName.REWARDS:
    case PositionName.VESTING:
      result.rewardTokens = detail.rewardTokenList || detail.tokenList || [];
      break;

    // Farming positions (usually staked LP + rewards)
    case PositionName.FARMING:
      // Farming positions have staked tokens and reward tokens
      result.stakeTokens = detail.supplyTokenList || [];
      result.rewardTokens = detail.rewardTokenList || [];
      break;

    // Yield positions (can have both supply and borrow)
    case PositionName.YIELD:
      result.supplyTokens = detail.supplyTokenList || [];
      result.borrowTokens = detail.borrowTokenList || [];
      result.rewardTokens = detail.rewardTokenList || [];
      break;

    // Investment positions
    case PositionName.INVESTMENT:
      result.supplyTokens = detail.supplyTokenList || [];
      break;

    // Leveraged farming (complex positions)
    case PositionName.LEVERAGED_FARMING:
      // These have supplies, borrows, and rewards
      result.supplyTokens = detail.supplyTokenList || [];
      result.borrowTokens = detail.borrowTokenList || [];
      result.rewardTokens = detail.rewardTokenList || [];
      break;

    // Unsupported or unknown types
    default:
      // Log for debugging but don't process
      logger.debug('[Mappings] Unknown position type: ' + item.name);
      break;
  }

  return result;
}

/**
 * Check if position type should be filtered out
 */
export function shouldFilterPositionType(positionName: PositionName | string): boolean {
  // Handle both numeric enums and string enums from backend
  const unsupportedTypes: readonly (PositionName | string)[] = [
    PositionName.PERPETUALS,
    PositionName.OPTIONS_BUYER,
    PositionName.OPTIONS_SELLER,
    PositionName.INSURANCE_BUYER,
    PositionName.INSURANCE_SELLER,
  ];

  return unsupportedTypes.includes(positionName);
}

/**
 * Check if position is an LP position
 */
export function isLpPosition(positionName: PositionName | string): boolean {
  return positionName === PositionName.LIQUIDITY_POOL || positionName === PositionName.FARMING;
}
