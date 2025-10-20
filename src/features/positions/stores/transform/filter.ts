import { type RainbowPosition } from '../../types';
import { PositionName, DetailType, type PortfolioItem } from '../../types/generated/positions/positions';
import { getExperimentalFlag, DEFI_POSITIONS_THRESHOLD_FILTER } from '@/config';

// ============ Constants ====================================================== //

const MIN_POSITION_VALUE_USD = 1;

const UNSUPPORTED_PROTOCOLS = ['hyperliquid'];

const UNSUPPORTED_POSITION_TYPES: readonly PositionName[] = [
  PositionName.PERPETUALS,
  PositionName.OPTIONS_BUYER,
  PositionName.OPTIONS_SELLER,
  PositionName.INSURANCE_BUYER,
  PositionName.INSURANCE_SELLER,
  PositionName.NFT_STAKED,
  PositionName.NFT_LIQUIDITY_POOL,
  PositionName.NFT_LENDING,
  PositionName.NFT_FRACTION,
  PositionName.NFT_P2P_BORROWER,
  PositionName.NFT_P2P_LENDER,
];

const UNSUPPORTED_DETAIL_TYPES: readonly DetailType[] = [DetailType.UNSPECIFIED, DetailType.UNRECOGNIZED];

// ============ Filters ======================================================== //

/**
 * Check if position value meets threshold
 * @param position - The position to check
 * @param threshold - The minimum value threshold
 */
function meetsValueThreshold(position: RainbowPosition, threshold: number = MIN_POSITION_VALUE_USD): boolean {
  const netValue = parseFloat(position.totals?.total?.amount || '0');
  return netValue >= threshold;
}

/**
 * Check if protocol is supported
 * @param position - The position to check
 */
function protocolSupported(position: RainbowPosition): boolean {
  const protocolName = position.type.toLowerCase();
  return !UNSUPPORTED_PROTOCOLS.includes(protocolName);
}

/**
 * Check if position has items
 */
function hasItems(position: RainbowPosition): boolean {
  return (
    position.deposits.length > 0 ||
    position.pools.length > 0 ||
    position.stakes.length > 0 ||
    position.borrows.length > 0 ||
    position.rewards.length > 0
  );
}

/**
 * Check if a portfolio item should be filtered out
 */
export function shouldFilterPortfolioItem(item: PortfolioItem): boolean {
  if (UNSUPPORTED_POSITION_TYPES.includes(item.name)) {
    return true;
  }

  const detailTypes = item.detailTypes ?? [];
  if (detailTypes.some(type => UNSUPPORTED_DETAIL_TYPES.includes(type))) {
    return true;
  }

  return false;
}

/**
 * Check if a position should be filtered out
 */
export function shouldFilterPosition(position: RainbowPosition, threshold: number = MIN_POSITION_VALUE_USD): boolean {
  if (!hasItems(position)) {
    return true;
  }

  if (!protocolSupported(position)) {
    return true;
  }

  const shouldApplyThresholdFilter = getExperimentalFlag(DEFI_POSITIONS_THRESHOLD_FILTER);
  if (shouldApplyThresholdFilter && !meetsValueThreshold(position, threshold)) {
    return true;
  }

  return false;
}
