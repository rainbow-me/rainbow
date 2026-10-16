import { type TokenTrades } from '@/features/spot-pnl/core/spotPnl';
import { calculateUnrealizedPnl, type UnrealizedPnl } from '@/features/spot-pnl/core/unrealizedPnl';
import { divWorklet, greaterThanWorklet, mulWorklet } from '@/framework/core/safeMath';

export const TOP_HOLDERS_LIMIT = 10;

export type TokenHolder = {
  address: string;
  /** Token units. */
  balance: string;
  /** Codex `wallet.category`, e.g. `NORMIE` or `EXCHANGE`. */
  category: string | null;
  /** Codex `wallet.identityLabels`, e.g. `BRIDGE` or `BOT`. */
  identityLabels: string[];
  /** `null` when Codex has no swap history for the wallet in this token. */
  trades: TokenTrades | null;
};

export type TokenHolders = {
  holders: TokenHolder[];
  /** USD per token. */
  priceUsd: string;
  /** Token units. */
  totalSupply: string;
};

/** Which Codex wallets count as real users; remote-configurable. */
export type HolderWalletFilter = {
  categories: string[];
  excludedLabels: string[];
};

export type StakeHolderRow = {
  holder: TokenHolder;
  /** Native currency. */
  value: string;
  /** Where 1 is 1%. */
  supplyPercentage: string;
};

export type ProfitHolderRow = {
  holder: TokenHolder;
  /** Native currency, of the whole balance rather than only its purchased part. */
  value: string;
  pnl: UnrealizedPnl;
};

export type TopHolders = {
  byStake: StakeHolderRow[];
  byProfit: ProfitHolderRow[];
};

export function isRealUser(holder: TokenHolder, filter: HolderWalletFilter): boolean {
  return (
    holder.category !== null &&
    filter.categories.includes(holder.category) &&
    !holder.identityLabels.some(label => filter.excludedLabels.includes(label))
  );
}

/**
 * The largest real-user holders, and among them the ones with the largest unrealized P&L in the native currency.
 * `holders` must be ordered by balance, descending. Holders without a swap cost basis cannot rank by profit.
 */
export function rankTopHolders({
  data: { holders, priceUsd, totalSupply },
  filter,
  usdToNativeRate,
}: {
  data: TokenHolders;
  filter: HolderWalletFilter;
  usdToNativeRate: number;
}): TopHolders {
  const price = mulWorklet(priceUsd, usdToNativeRate);
  const hasSupply = greaterThanWorklet(totalSupply, 0);
  const realUsers = holders.filter(holder => isRealUser(holder, filter));

  const byStake = realUsers.slice(0, TOP_HOLDERS_LIMIT).map(holder => ({
    holder,
    value: mulWorklet(holder.balance, price),
    supplyPercentage: hasSupply ? mulWorklet(divWorklet(holder.balance, totalSupply), 100) : '0',
  }));

  const byProfit: ProfitHolderRow[] = [];
  for (const holder of realUsers) {
    if (!holder.trades) continue;
    const pnl = calculateUnrealizedPnl({ acquisition: holder.trades, balance: holder.balance, price, usdToNativeRate });
    if (pnl) byProfit.push({ holder, value: mulWorklet(holder.balance, price), pnl });
  }
  byProfit.sort((a, b) => (greaterThanWorklet(b.pnl.amount, a.pnl.amount) ? 1 : greaterThanWorklet(a.pnl.amount, b.pnl.amount) ? -1 : 0));

  return { byStake, byProfit: byProfit.slice(0, TOP_HOLDERS_LIMIT) };
}
