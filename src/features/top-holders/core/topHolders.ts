import { calculateRealizedReturn, type RealizedReturnUsd, type WalletTokenTrades } from '@/features/spot-pnl/core/spotPnl';
import { calculateUnrealizedPnl, type UnrealizedPnl } from '@/features/spot-pnl/core/unrealizedPnl';
import { divWorklet, greaterThanOrEqualToWorklet, greaterThanWorklet, mulWorklet } from '@/framework/core/safeMath';

export const TOP_HOLDERS_LIMIT = 10;

/** In USD. Smaller positions are dust, whose near-zero P&L would otherwise fill Unrealized after the winners. */
const MIN_UNREALIZED_POSITION_VALUE = 1;

export type TokenHolder = {
  address: string;
  /** Token units. */
  balance: string;
  /** Codex `wallet.category`, e.g. `NORMIE` or `EXCHANGE`. */
  category: string | null;
  /** Codex `wallet.identityLabels`, e.g. `BRIDGE` or `BOT`. */
  identityLabels: string[];
};

/** A wallet's swap trades in the token, from Codex's traders of the token. */
export type TokenTrader = WalletTokenTrades & { address: string };

/** Which Codex wallets count as real users; remote-configurable. */
export type HolderWalletFilter = {
  categories: string[];
  excludedLabels: string[];
};

export type HoldingRow = {
  address: string;
  valueUsd: string;
  /** Where 1 is 1%. */
  supplyPercentage: string;
};

export type UnrealizedRow = {
  address: string;
  /** In USD. */
  pnl: UnrealizedPnl;
  /** USD per token. */
  avgEntryUsd: string;
};

export type RealizedRow = {
  address: string;
  realized: RealizedReturnUsd;
};

export type TopHolders = {
  holding: HoldingRow[];
  unrealized: UnrealizedRow[];
  realized: RealizedRow[];
};

export function isHolderWalletFilter(value: unknown): value is HolderWalletFilter {
  if (typeof value !== 'object' || value === null) return false;
  const { categories, excludedLabels } = value as Record<keyof HolderWalletFilter, unknown>;
  return isStringArray(categories) && isStringArray(excludedLabels);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export function isRealUser(holder: TokenHolder, filter: HolderWalletFilter): boolean {
  return (
    holder.category !== null &&
    filter.categories.includes(holder.category) &&
    !holder.identityLabels.some(label => filter.excludedLabels.includes(label))
  );
}

/** The largest real-user holders. `holders` is ordered by balance, descending. */
export function rankHolding(
  { holders, priceUsd, totalSupply }: { holders: TokenHolder[]; priceUsd: string; totalSupply: string },
  filter: HolderWalletFilter
): HoldingRow[] {
  const hasSupply = greaterThanWorklet(totalSupply, 0);
  return holders
    .filter(holder => isRealUser(holder, filter))
    .slice(0, TOP_HOLDERS_LIMIT)
    .map(holder => ({
      address: holder.address,
      valueUsd: mulWorklet(holder.balance, priceUsd),
      supplyPercentage: hasSupply ? mulWorklet(divWorklet(holder.balance, totalSupply), 100) : '0',
    }));
}

/**
 * The traders with the largest unrealized P&L in USD, losses included, on their live balance. Traders without
 * bought tokens still held have no P&L, and dust positions are left out.
 */
export function rankUnrealized(traders: TokenTrader[], priceUsd: string): UnrealizedRow[] {
  const rows: UnrealizedRow[] = [];
  for (const trader of traders) {
    const pnl = calculateUnrealizedPnl({ acquisition: trader, balance: trader.tokenBalanceLive, price: priceUsd, usdToNativeRate: 1 });
    if (pnl && greaterThanOrEqualToWorklet(pnl.value, MIN_UNREALIZED_POSITION_VALUE)) {
      rows.push({
        address: trader.address,
        pnl,
        avgEntryUsd: divWorklet(trader.tokenAcquisitionCostUsd, trader.purchasedTokenBalance),
      });
    }
  }
  rows.sort((a, b) => (greaterThanWorklet(b.pnl.amount, a.pnl.amount) ? 1 : greaterThanWorklet(a.pnl.amount, b.pnl.amount) ? -1 : 0));
  return rows.slice(0, TOP_HOLDERS_LIMIT);
}

/** `traders` is already ranked by realized profit in USD. */
export function rankRealized(traders: TokenTrader[]): RealizedRow[] {
  return traders.slice(0, TOP_HOLDERS_LIMIT).map(trader => ({ address: trader.address, realized: calculateRealizedReturn(trader) }));
}
