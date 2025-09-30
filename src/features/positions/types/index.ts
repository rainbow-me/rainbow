// Import generated types that are used in internal types
import type { Asset, AssetPrice } from './generated/common/asset';
import type { PositionToken, DApp_Colors } from './generated/positions/positions';

// ============ Internal Types ================================================= //

/**
 * Formatted value objects with amount (raw) and display (localized string)
 * Same format as legacy ADDYS Assets API and live pricing responses for consistency
 */
export interface NativeDisplay {
  amount: string; // e.g., "1500.25"
  display: string; // e.g., "$1,500.25" or "€1.234,56" based on locale
}

/**
 * Additional price fields expected by UI layers (legacy snake_case support)
 */
export interface PositionAssetPrice extends Omit<AssetPrice, 'changedAt' | 'relativeChange24h'> {
  changed_at: number;
  relative_change_24h: number;
}

/**
 * Asset metadata aligned with historical PositionAsset expectations
 */
export interface PositionAsset extends Omit<Asset, 'iconUrl' | 'chainId' | 'price' | 'colors'> {
  chain_id: number;
  icon_url: string;
  price: PositionAssetPrice;
  colors: (Asset['colors'] & { shadow?: string }) | undefined;
}

/**
 * Position totals structure with category breakdowns. The `totals` field is kept
 * for backwards compatibility with legacy UI code that still references
 * `position.totals.totals`.
 */
export interface PositionsTotals {
  totals: NativeDisplay; // Primary field used by UI (`position.totals.totals`)
  totalDeposits: NativeDisplay; // Total deposited value across all protocols
  totalBorrows: NativeDisplay; // Total borrowed value across all protocols
  totalRewards: NativeDisplay; // Total rewards value
  totalLocked: string; // Legacy field from Addys totals
}

/**
 * Range status for LP positions
 */
export type RangeStatus = 'in_range' | 'out_of_range' | 'full_range';

/**
 * Enhanced underlying asset with native display values
 */
export interface RainbowUnderlyingAsset {
  asset: PositionAsset;
  quantity: string;
  native: NativeDisplay;
}

/**
 * Enhanced deposit type with LP detection and value calculations
 */
export interface RainbowDeposit {
  asset: PositionAsset;
  quantity: string;
  pool_address?: string;
  isLp: boolean; // Computed: LP token detection
  isConcentratedLiquidity: boolean; // Computed: Uniswap V3 detection
  totalValue: string; // Computed: Total USD value (fiat amount string)
  underlying: RainbowUnderlyingAsset[]; // Enhanced with native values
  omit_from_total?: boolean;
  apr?: string;
  apy?: string;
  dappVersion?: string; // Computed: Protocol version
  total_asset?: string;
}

/**
 * LP position with range and allocation information
 */
export interface RainbowPool {
  asset: PositionAsset;
  quantity: string;
  pool_address?: string;
  isConcentratedLiquidity: boolean;
  rangeStatus: RangeStatus;
  allocation: string; // e.g., "50/50" or "100/0"
  totalValue: string;
  underlying: RainbowUnderlyingAsset[];
  omit_from_total?: boolean;
  dappVersion?: string;
}

/**
 * Staked position with optional unlock time
 */
export interface RainbowStake {
  asset: PositionAsset;
  quantity: string;
  pool_address?: string;
  isLp: boolean;
  isConcentratedLiquidity: boolean;
  totalValue: string;
  underlying: RainbowUnderlyingAsset[];
  omit_from_total?: boolean;
  apr?: string;
  apy?: string;
  dappVersion?: string;
  unlockTime?: Date;
}

/**
 * Borrowed position with health indicators
 */
export interface RainbowBorrow {
  asset: PositionAsset;
  quantity: string;
  pool_address?: string;
  totalValue: string;
  underlying: RainbowUnderlyingAsset[];
  omit_from_total?: boolean;
  apr?: string;
  apy?: string;
  dappVersion?: string;
  healthRate?: number;
}

/**
 * Claimable rewards
 */
export interface RainbowReward {
  asset: PositionAsset;
  quantity: string;
  native: NativeDisplay;
  omit_from_total?: boolean;
  dappVersion?: string;
  claimableAmount?: string;
}

/**
 * Dapp metadata with normalized fields for UI consumption
 */
export interface RainbowDapp {
  name: string;
  url: string;
  icon_url: string;
  colors: DApp_Colors;
}

/**
 * Individual protocol position aggregated across chains
 */
export interface RainbowPosition {
  type: string; // Canonical protocol name (e.g., "Uniswap")
  protocol_version?: string; // Version display in UI badge (e.g., "V3")
  chainIds: number[]; // All chains where user has positions
  totals: PositionsTotals; // Pre-calculated for position card display
  deposits: RainbowDeposit[]; // Regular deposits section in expanded sheet
  pools: RainbowPool[]; // LP positions section with special UI treatment
  stakes: RainbowStake[]; // Staking section with unlock times
  borrows: RainbowBorrow[]; // Debt section with health indicators
  rewards: RainbowReward[]; // Rewards section with claim hints
  dapp: RainbowDapp; // Icon, colors, URL for position card
}

/**
 * Main container for all DeFi positions data
 */
export interface RainbowPositions {
  totals: PositionsTotals;
  positionTokens: string[]; // LP/staked tokens to exclude from wallet assets
  positions: Record<string, RainbowPosition>; // Keyed by canonical protocol
}

/**
 * Category mapping result from PortfolioItem processing
 */
export interface CategoryResult {
  supplyTokens?: PositionToken[];
  stakeTokens?: PositionToken[];
  borrowTokens?: PositionToken[];
  rewardTokens?: PositionToken[];
}

/**
 * Protocol grouping intermediate structure
 */
export interface ProtocolGroup {
  [canonicalName: string]: RainbowPosition;
}

// ============ API Types ====================================================== //

/**
 * API types are generated from protobuf definitions
 * Source: https://github.com/rainbow-me/protobuf-registry/tree/main/schemas/gateways/gen/v1
 * These types are automatically generated and should not be modified directly
 */

// Re-export generated types from the protobuf-generated directory
// Export enums as values (they're const objects)
export { PositionName, DetailType } from './generated/positions/positions';

// Export types as types
export type {
  // Core position types
  PositionToken,
  Stats,
  PortfolioItem,
  DApp,
  DApp_Colors,
  // Request/Response types
  Position,
  ListPositionsResponse,
  ListPositionsResponse_Result,
} from './generated/positions/positions';

/**
 * NOTE: The generated types differ from the actual API response in some ways:
 *
 * Asset type (generated vs actual API):
 * - Uses `address` field (generated) vs `id` field (API response)
 * - Uses `iconUrl` field correctly
 * - `decimals` is number (generated) vs string (API response)
 * - `price` is AssetPrice object (generated) vs string (API response)
 *
 * Stats type (generated vs actual API):
 * - Uses `assetValue` (generated) vs `assetUsdValue` (API response)
 * - Uses `debtValue` (generated) vs `debtUsdValue` (API response)
 * - Uses `netValue` (generated) vs `netUsdValue` (API response)
 *
 * Enums:
 * - PositionName values: No LENDING, LIQUIDITY_POOL, BORROWED, REWARDS, PERPETUALS, DEPOSITED, VESTING
 * - Available: YIELD, DEPOSIT, STAKED, LOCKED, FARMING, LEVERAGED_FARMING, etc.
 *
 * Optional fields:
 * - All fields in generated types are optional
 * - `protocolVersion` may be undefined in Position
 * - `uniqueTokens` field in ListPositionsResponse_Result may be undefined
 */
