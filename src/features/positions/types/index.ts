// Import generated types that are used in internal types
import type { Asset, AssetPrice } from './generated/common/asset';
import type { DApp, DApp_Colors } from './generated/common/dapp';

// ============ Internal Types ================================================= //

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
export type PositionAsset = Omit<Asset, 'price' | 'colors' | 'creationDate' | 'iconUrl'> & {
  chainId: number;
  uniqueId: string;
  icon_url: string; // for token component compatibility
  creationDate: string | undefined;
  price: PositionAssetPrice | undefined;
  colors: (Asset['colors'] & { shadow?: string }) | undefined;
};

/**
 * Position totals structure with category breakdowns. The `total` field is
 * the primary field used by UI code.
 */
export type PositionsTotals = {
  total: { amount: string; display: string }; // Primary field used by UI
  totalDeposits: { amount: string; display: string }; // Total deposited value across all protocols
  totalBorrows: { amount: string; display: string }; // Total borrowed value across all protocols
  totalRewards: { amount: string; display: string }; // Total rewards value
  totalLocked: { amount: string; display: string }; // Total locked value (time-locked stakes)
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
  value: { amount: string; display: string }; // e.g., { "amount": "1500.25", "display": "$1,500.25" }
};

/**
 * Base type for all position items (internal use only)
 * No metadata fields - those are added via discriminated unions
 */
type RainbowBaseItem = {
  asset: PositionAsset;
  quantity: string;
  value: { amount: string; display: string };
  underlying: RainbowUnderlyingAsset[];
  dappVersion?: string;
  poolAddress?: string;
};

/**
 * Enhanced deposit type - discriminated by detail type metadata
 */
export type RainbowDeposit =
  | (RainbowBaseItem & { apy?: string; name?: string }) // COMMON
  | (RainbowBaseItem & { apy?: string; healthRate?: number }) // LENDING
  | (RainbowBaseItem & { apy?: string; name?: string; unlockTime?: string }); // LOCKED

/**
 * LP position with range and allocation information
 * Only COMMON detail type uses pools
 */
export type RainbowPool = RainbowBaseItem & {
  poolAddress?: string;
  isConcentratedLiquidity: boolean;
  rangeStatus: RangeStatus;
  allocation: string;
  name?: string; // COMMON - display name (from description field, filtered)
};

/**
 * Borrowed position - discriminated by detail type metadata
 */
export type RainbowBorrow =
  | (RainbowBaseItem & { apy?: string; name?: string }) // COMMON
  | (RainbowBaseItem & { apy?: string; healthRate?: number }) // LENDING
  | (RainbowBaseItem & { apy?: string; debtRatio?: string }); // LEVERAGED_FARMING

/**
 * Claimable rewards - discriminated by detail type metadata
 */
export type RainbowReward = RainbowBaseItem &
  (
    | { name?: string } // COMMON
    | { healthRate?: number } // LENDING
    | { debtRatio?: string } // LEVERAGED_FARMING
    | { name?: string; unlockTime?: string } // LOCKED
    | Record<string, never> // REWARD
  );

/**
 * Staked position - discriminated by LP and locked status, with metadata
 */
type RainbowStakeRegular = RainbowBaseItem & {
  apy?: string;
  isLp: false;
  isLocked?: boolean;
} & (
    | { debtRatio?: string } // LEVERAGED_FARMING
    | { name?: string; unlockTime?: string } // LOCKED
    | Record<string, never> // FARMING
  );

type RainbowStakeLp = RainbowPool & {
  apy?: string;
  isLp: true;
  isLocked?: boolean;
} & (
    | { debtRatio?: string } // LEVERAGED_FARMING
    | { name?: string; unlockTime?: string } // LOCKED
    | Record<string, never> // FARMING
  );

export type RainbowStake = RainbowStakeRegular | RainbowStakeLp;

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
  protocolVersion?: string; // Version display in UI badge (e.g., "V3")
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
