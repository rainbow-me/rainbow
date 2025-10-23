import { type RainbowPosition } from '../../types';
import { PositionName, DetailType, type PortfolioItem, type PositionToken } from '../../types/generated/positions/positions';
import { getExperimentalFlag, DEFI_POSITIONS_THRESHOLD_FILTER } from '@/config';

// ============ Constants ====================================================== //

const MIN_POSITION_VALUE_USD = 1;
const MIN_ASSET_VALUE_USD = 0.01;

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

/**
 * Portfolio item descriptions that represent token-preferred positions
 * These are liquid staking derivatives (LSDs) or similar positions that users think of as wallet assets
 * rather than DeFi positions. Filtering them here prevents double-counting and UI clutter.
 *
 * LSDs are transferable tokens that users receive when staking. They:
 * - Appear in user's wallet as regular tokens
 * - Can be traded, transferred, or used in DeFi
 * - Represent staked assets (e.g., stETH represents staked ETH)
 * - Should NOT also appear as positions (to avoid double-counting)
 */
const TOKEN_PREFERRED_POSITIONS = [
  // ============================================================================
  // Confirmed in test fixture data (5 tokens)
  // ============================================================================

  'wstETH', // Lido - https://lido.fi - Wrapped staked ETH
  'sAVAX', // BENQI - https://benqi.fi - Liquid staked AVAX
  'ezETH', // Renzo - https://renzoprotocol.com - Restaked ETH
  'swETH', // Swell - https://swellnetwork.io - Staked ETH
  'rETH', // Rocket Pool - https://rocketpool.net - Staked ETH

  // ============================================================================
  // Proactive additions (major LSDs likely to appear in user wallets)
  // ============================================================================

  'stETH', // Lido - https://lido.fi - Staked ETH
  'stMATIC', // Lido - https://lido.fi - Staked MATIC
  'sfrxETH', // Frax - https://frax.finance - Staked ETH
  'cbETH', // Coinbase - https://coinbase.com/cbeth - Wrapped staked ETH
  'sETH2', // StakeWise - https://stakewise.io - Staked ETH
  'ankrETH', // Ankr - https://ankr.com - Staked ETH
  'rMATIC', // StaFi - https://stafi.io - Staked MATIC
];

// ============ Filters ======================================================== //

/**
 * Check if position value meets threshold
 * @param position - The position to check
 * @param threshold - The minimum value threshold
 */
function meetsValueThreshold(position: RainbowPosition): boolean {
  const netValue = parseFloat(position.totals?.total?.amount || '0');
  return netValue >= MIN_POSITION_VALUE_USD;
}

/**
 * Check if an underlying asset should be filtered out
 * Filters out "dust" - assets with value > 0 but < $0.01
 * @param token - The position token to check
 */
export function shouldFilterUnderlyingAsset(token: PositionToken): boolean {
  const shouldApplyFilter = getExperimentalFlag(DEFI_POSITIONS_THRESHOLD_FILTER);
  if (!shouldApplyFilter) {
    return false;
  }

  if (!token.asset) {
    return false; // Keep zero-value assets
  }

  const valueAmount = parseFloat(token.assetValue);

  // Keep zero-value assets (may have special meaning)
  // Keep assets >= $0.01
  // Filter out dust: 0 < value < $0.01
  const meetsThreshold = valueAmount === 0 || valueAmount >= MIN_ASSET_VALUE_USD;

  return !meetsThreshold;
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
 * Filters:
 * 1. Unsupported position types (NFTs, perpetuals, options, etc.)
 * 2. Unsupported detail types (unspecified, unrecognized)
 * 3. Token-preferred positions (LSDs like wstETH identified by description)
 */
export function shouldFilterPortfolioItem(item: PortfolioItem): boolean {
  if (UNSUPPORTED_POSITION_TYPES.includes(item.name)) {
    return true;
  }

  const detailTypes = item.detailTypes ?? [];
  if (detailTypes.some(type => UNSUPPORTED_DETAIL_TYPES.includes(type))) {
    return true;
  }

  // Filter token-preferred positions by description (e.g., wstETH staking)
  if (item.detail?.description && TOKEN_PREFERRED_POSITIONS.includes(item.detail.description)) {
    return true;
  }

  return false;
}

/**
 * Check if a position should be filtered out
 */
export function shouldFilterPosition(position: RainbowPosition): boolean {
  if (!hasItems(position)) {
    return true;
  }

  if (!protocolSupported(position)) {
    return true;
  }

  const shouldApplyThresholdFilter = getExperimentalFlag(DEFI_POSITIONS_THRESHOLD_FILTER);
  if (shouldApplyThresholdFilter && !meetsValueThreshold(position)) {
    return true;
  }

  return false;
}
