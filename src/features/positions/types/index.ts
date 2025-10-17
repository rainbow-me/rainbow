// Import generated types that are used in internal types
import type { Asset, AssetPrice } from './generated/common/asset';
import type { DApp, DApp_Colors } from './generated/common/dapp';
import type { PositionToken } from './generated/positions/positions';

// ============ Internal Types ================================================= //

/**
 * Formatted value objects with amount (raw) and display (localized string)
 * Same format as legacy ADDYS Assets API and live pricing responses for consistency
 */
export type NativeDisplay = {
  amount: string; // e.g., "1500.25"
  display: string; // e.g., "$1,500.25" or "€1.234,56" based on locale
};

/**
 * Additional price fields expected by UI layers (legacy snake_case support)
 */
export type PositionAssetPrice = Omit<AssetPrice, 'changedAt' | 'relativeChange24h'> & {
  changed_at?: number | undefined;
  relative_change_24h?: number | undefined;
};

/**
 * Asset metadata aligned with historical PositionAsset expectations
 */
export type PositionAsset = Omit<Asset, 'iconUrl' | 'chainId' | 'network' | 'price' | 'colors'> & {
  chain_id: number;
  icon_url: string;
  price: PositionAssetPrice; // only expect value field currently
  colors: (Asset['colors'] & { shadow?: string }) | undefined;
};

/**
 * Position totals structure with category breakdowns. The `total` field is
 * the primary field used by UI code.
 */
export type PositionsTotals = {
  total: NativeDisplay; // Primary field used by UI
  totalDeposits: NativeDisplay; // Total deposited value across all protocols
  totalBorrows: NativeDisplay; // Total borrowed value across all protocols
  totalRewards: NativeDisplay; // Total rewards value
  totalLocked: NativeDisplay; // Total locked value (time-locked stakes)
};

/**
 * Range status for LP positions
 */
export type RangeStatus = 'in_range' | 'out_of_range' | 'full_range';

/**
 * Enhanced underlying asset with native display values
 */
export type RainbowUnderlyingAsset = {
  asset: PositionAsset;
  quantity: string; // e.g., ".75013242445" (not wei)
  native: NativeDisplay; // e.g., { "amount": "1500.25", "display": "$1,500.25" }
};

/**
 * Enhanced deposit type with LP detection and value calculations
 */
export type RainbowDeposit = {
  asset: PositionAsset;
  quantity: string; // e.g., ".75013242445" (not wei)
  pool_address?: string;
  isConcentratedLiquidity: boolean; // Computed: Uniswap V3 detection
  totalValue: string; // Computed: Total USD value (fiat amount string)
  underlying: RainbowUnderlyingAsset[]; // Enhanced with native values
  dappVersion?: string; // Computed: Protocol version
  apr?: string; // Not yet supported
  apy?: string; // Not yet supported
};

/**
 * LP position with range and allocation information
 */
export type RainbowPool = {
  asset: PositionAsset;
  quantity: string; // e.g., ".75013242445" (not wei)
  pool_address?: string;
  isConcentratedLiquidity: boolean;
  rangeStatus: RangeStatus;
  allocation: string; // e.g., "50/50" or "100/0"
  totalValue: string; // e.g., "1500.25"
  underlying: RainbowUnderlyingAsset[];
  dappVersion?: string; // Computed: Protocol version
};

/**
 * Staked position - discriminated union by isLp
 * Can be single token or LP, regular or locked
 * Farming is a special case of Staked where reward
 * tokens are different from the deposit token
 */
export type RainbowStake =
  | (RainbowDeposit & { isLp: false; isLocked?: boolean })
  | (RainbowDeposit & { isLp: true; rangeStatus: RangeStatus; allocation: string; isLocked?: boolean });

/**
 * Borrowed position
 */
export type RainbowBorrow = {
  asset: PositionAsset;
  quantity: string; // e.g., ".75013242445" (not wei)
  pool_address?: string;
  totalValue: string; // e.g., "1500.25"
  underlying: RainbowUnderlyingAsset[];
  dappVersion?: string; // Computed: Protocol version
  apr?: string; // Not yet supported
  apy?: string; // Not yet supported
};

/**
 * Claimable rewards
 */
export type RainbowReward = {
  asset: PositionAsset;
  quantity: string; // e.g., ".75013242445" (not wei)
  totalValue: string; // e.g., "1500.25"
  native: NativeDisplay; // e.g., { "amount": "1500.25", "display": "$1,500.25" }
  dappVersion?: string; // Computed: Protocol version
};

/**
 * Dapp metadata with normalized fields for UI consumption
 */
export type RainbowDapp = Omit<DApp, 'iconUrl' | 'colors'> & {
  icon_url: string;
  colors: DApp_Colors;
};

/**
 * Individual protocol position aggregated across chains
 */
export type RainbowPosition = {
  type: string; // Canonical protocol name (e.g., "Uniswap")
  protocol_version?: string; // Version display in UI badge (e.g., "V3")
  chainIds: number[]; // All chains where user has positions
  totals: PositionsTotals; // Pre-calculated for position card display
  deposits: RainbowDeposit[]; // Regular deposits section in expanded sheet
  pools: RainbowPool[]; // LP positions section with special UI treatment
  stakes: RainbowStake[]; // Staking section (regular stakes, LP stakes, farming)
  borrows: RainbowBorrow[]; // Debt section with health indicators
  rewards: RainbowReward[]; // Rewards section with claim hints
  dapp: RainbowDapp; // Icon, colors, URL for position card
};

/**
 * Main container for all DeFi positions data
 */
export type RainbowPositions = {
  totals: PositionsTotals; // Aggregate totals for categories, locked, and grand total
  positionTokens: string[]; // LP/staked tokens to exclude from wallet assets
  positions: Record<string, RainbowPosition>; // Keyed by canonical protocol
};

/**
 * Category mapping result from PortfolioItem processing
 */
export type CategoryResult = {
  supplyTokens?: PositionToken[];
  stakeTokens?: PositionToken[];
  borrowTokens?: PositionToken[];
  rewardTokens?: PositionToken[];
};

/**
 * Protocol grouping intermediate structure
 */
export type ProtocolGroup = {
  [canonicalName: string]: RainbowPosition;
};

// ============ API Types ====================================================== //

/**
 * API types are generated from protobuf definitions
 * Source: https://github.com/rainbow-me/protobuf-registry/tree/main/schemas/gateways/gen/v1
 * These types are automatically generated and should not be modified directly
 */

// Re-export generated types from the protobuf-generated directory

// Export enums as values
export { PositionName, DetailType } from './generated/positions/positions';

export type {
  // Core DeBank position types/enums
  PositionToken,
  PortfolioItem,
  // Request/Response types
  Position,
  ListPositionsResponse,
} from './generated/positions/positions';
