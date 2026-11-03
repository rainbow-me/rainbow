import { divWorklet, greaterThanWorklet, mulWorklet, subWorklet, sumWorklet } from '@/framework/core/safeMath';

import { calculateUnrealizedPnl, type TokenAcquisition, type UnrealizedPnl } from './unrealizedPnl';

/** Codex's sale fields cover a trailing one-year window; it has no all-time equivalent per token. */
export type TokenTrades = TokenAcquisition & {
  tokenAmountSold1y: string;
  amountSoldUsd1y: string;
  realizedProfitUsd1y: string;
  /** Unix seconds, including transfers. */
  lastTransactionAt: number;
};

export type WalletTokenTrades = TokenTrades & {
  /** Token units the wallet holds now. */
  tokenBalanceLive: string;
};

/** Realized figures in USD. */
export type RealizedReturnUsd = {
  /** Signed realized profit. */
  amount: string;
  /** Signed, where 1 is 1%; `null` when the sold tokens have no cost to relate the profit to. */
  percentage: string | null;
  /** Cost of the tokens sold. */
  cost: string;
};

export type SpotPnlVariant = 'unrealized' | 'partiallyRealized' | 'fullyRealized';

/** Where the P&L sheet was opened from: the expanded sheet's pill, or a row in one of the Top Holders tabs. */
export type SpotPnlSheetEntryPoint = 'pill' | 'topHoldersHolding' | 'topHoldersUnrealized' | 'topHoldersRealized';

export type PnlReturn = {
  /** Signed, in the native currency. */
  amount: string;
  /** Signed, where 1 is 1%; `null` when there is no cost to relate the amount to. */
  percentage: string | null;
};

type SpotPnlBase = {
  /** Native currency. */
  invested: string;
  /** Native currency per token. */
  avgEntry: string;
  /** Token units held but not purchased, which have no cost basis. */
  excludedBalance: string;
  /** Unrealized P&L of the held position in USD; `null` when nothing purchased is held. */
  unrealizedPnlUsd: string | null;
  /** Realized P&L in USD; `null` when nothing was sold. */
  realizedPnlUsd: string | null;
};

export type SpotPnl =
  | (SpotPnlBase & { variant: 'unrealized'; position: UnrealizedPnl; current: string })
  | (SpotPnlBase & { variant: 'partiallyRealized'; position: UnrealizedPnl; current: string; realized: PnlReturn; total: PnlReturn })
  | (SpotPnlBase & { variant: 'fullyRealized'; avgExit: string; realized: PnlReturn });

/**
 * P&L of a wallet's swap trades in one token, or `null` when there is nothing to show. Held figures match
 * {@link calculateUnrealizedPnl}; realized figures come from Codex's one-year sale aggregates.
 */
export function calculateSpotPnl({
  trades,
  balance,
  price,
  usdToNativeRate,
}: {
  trades: TokenTrades;
  /** Token units held by the wallet. */
  balance: string;
  /** Native currency per token. */
  price: string;
  usdToNativeRate: number;
}): SpotPnl | null {
  const { purchasedTokenBalance, tokenAcquisitionCostUsd, tokenAmountSold1y, amountSoldUsd1y } = trades;
  const hasSold = greaterThanWorklet(tokenAmountSold1y, 0);
  const toNative = (usd: string) => mulWorklet(usd, usdToNativeRate);
  const realizedUsd = calculateRealizedReturn(trades);
  const soldCostUsd = realizedUsd.cost;
  const realized: PnlReturn = { amount: toNative(realizedUsd.amount), percentage: realizedUsd.percentage };

  const position = calculateUnrealizedPnl({ acquisition: trades, balance, price, usdToNativeRate });
  const isHeld = greaterThanWorklet(purchasedTokenBalance, 0) && greaterThanWorklet(balance, 0);

  if (!isHeld) {
    if (!hasSold) return null;
    return {
      variant: 'fullyRealized',
      invested: toNative(soldCostUsd),
      avgEntry: toNative(divWorklet(soldCostUsd, tokenAmountSold1y)),
      avgExit: toNative(divWorklet(amountSoldUsd1y, tokenAmountSold1y)),
      realized,
      excludedBalance: balance,
      unrealizedPnlUsd: null,
      realizedPnlUsd: realizedUsd.amount,
    };
  }

  if (!position) return null;

  const held = {
    position,
    current: price,
    invested: position.cost,
    avgEntry: toNative(divWorklet(tokenAcquisitionCostUsd, purchasedTokenBalance)),
    excludedBalance: subWorklet(balance, position.heldBalance),
  };
  const positionPnlUsd = divWorklet(position.amount, usdToNativeRate);

  if (!hasSold) return { variant: 'unrealized', ...held, unrealizedPnlUsd: positionPnlUsd, realizedPnlUsd: null };

  const totalUsd = sumWorklet(realizedUsd.amount, positionPnlUsd);
  return {
    variant: 'partiallyRealized',
    ...held,
    realized,
    total: {
      amount: toNative(totalUsd),
      percentage: percentageOf(totalUsd, sumWorklet(divWorklet(position.cost, usdToNativeRate), soldCostUsd)),
    },
    unrealizedPnlUsd: positionPnlUsd,
    realizedPnlUsd: realizedUsd.amount,
  };
}

export type SpotPnlViewSummary = {
  variant: SpotPnlVariant | null;
  unrealizedPnlUsd: number | null;
  realizedPnlUsd: number | null;
  /** Unix seconds. */
  lastTradeAt: number | null;
};

/**
 * What the P&L sheet's view event reports, all `null` when there is nothing to show, or `null` while the sheet has
 * not settled on either.
 */
export function summarizeSpotPnlView({
  pnl,
  lastTradeAt,
  isLoaded,
  price,
}: {
  pnl: SpotPnl | null;
  lastTradeAt: number | undefined;
  /** The trades loaded successfully and the USD rate is known. */
  isLoaded: boolean;
  /** Native currency per token. */
  price: string;
}): SpotPnlViewSummary | null {
  if (pnl) {
    return {
      variant: pnl.variant,
      unrealizedPnlUsd: pnl.unrealizedPnlUsd === null ? null : Number(pnl.unrealizedPnlUsd),
      realizedPnlUsd: pnl.realizedPnlUsd === null ? null : Number(pnl.realizedPnlUsd),
      lastTradeAt: lastTradeAt ?? null,
    };
  }
  // A failed load or a missing price also leaves nothing to show, but says nothing about the position
  if (!isLoaded || !greaterThanWorklet(price, 0)) return null;
  return { variant: null, unrealizedPnlUsd: null, realizedPnlUsd: null, lastTradeAt: null };
}

/** Realized P&L of the tokens sold in Codex's one-year window. */
export function calculateRealizedReturn({
  amountSoldUsd1y,
  realizedProfitUsd1y,
}: Pick<TokenTrades, 'amountSoldUsd1y' | 'realizedProfitUsd1y'>): RealizedReturnUsd {
  const cost = subWorklet(amountSoldUsd1y, realizedProfitUsd1y);
  return { amount: realizedProfitUsd1y, percentage: percentageOf(realizedProfitUsd1y, cost), cost };
}

function percentageOf(amount: string, cost: string): string | null {
  return greaterThanWorklet(cost, 0) ? mulWorklet(divWorklet(amount, cost), 100) : null;
}
