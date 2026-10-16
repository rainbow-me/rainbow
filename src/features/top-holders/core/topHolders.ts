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
  /** Ordered by balance, descending. */
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
  valueUsd: string;
  /** Where 1 is 1%. */
  supplyPercentage: string;
};

export type ProfitHolderRow = {
  holder: TokenHolder;
  /** Of the whole balance rather than only its purchased part. */
  valueUsd: string;
  /** In USD. */
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
 * The largest real-user holders, and among them the ones with the largest unrealized P&L in USD. Holders without
 * a swap cost basis cannot rank by profit.
 */
export function rankTopHolders({ holders, priceUsd, totalSupply }: TokenHolders, filter: HolderWalletFilter): TopHolders {
  const hasSupply = greaterThanWorklet(totalSupply, 0);
  const realUsers = holders.filter(holder => isRealUser(holder, filter));

  const byStake = realUsers.slice(0, TOP_HOLDERS_LIMIT).map(holder => ({
    holder,
    valueUsd: mulWorklet(holder.balance, priceUsd),
    supplyPercentage: hasSupply ? mulWorklet(divWorklet(holder.balance, totalSupply), 100) : '0',
  }));

  const byProfit: ProfitHolderRow[] = [];
  for (const holder of realUsers) {
    if (!holder.trades) continue;
    const pnl = calculateUnrealizedPnl({ acquisition: holder.trades, balance: holder.balance, price: priceUsd, usdToNativeRate: 1 });
    if (pnl) byProfit.push({ holder, valueUsd: mulWorklet(holder.balance, priceUsd), pnl });
  }
  byProfit.sort((a, b) => (greaterThanWorklet(b.pnl.amount, a.pnl.amount) ? 1 : greaterThanWorklet(a.pnl.amount, b.pnl.amount) ? -1 : 0));

  return { byStake, byProfit: byProfit.slice(0, TOP_HOLDERS_LIMIT) };
}
