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

/** Whose P&L the sheet shows: the selected wallet's, or a Top Holders row's. */
export type SpotPnlWalletSource = 'selected' | 'top_holder';

/** A wallet other than the selected one, with the Codex data it was listed with. */
export type SpotPnlHolder = {
  address: string;
  ensName: string | null;
  /** Token units. */
  balance: string;
  trades: TokenTrades | null;
};

export type SpotPnlVariant = 'unrealized' | 'partiallyRealized' | 'fullyRealized';

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
  /** The headline return in USD: unrealized P&L, Total Return or Realized Return, depending on the variant. */
  headlineUsd: string;
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
  const { purchasedTokenBalance, tokenAcquisitionCostUsd, tokenAmountSold1y, amountSoldUsd1y, realizedProfitUsd1y } = trades;
  const hasSold = greaterThanWorklet(tokenAmountSold1y, 0);
  const toNative = (usd: string) => mulWorklet(usd, usdToNativeRate);
  const soldCostUsd = subWorklet(amountSoldUsd1y, realizedProfitUsd1y);
  const realized: PnlReturn = { amount: toNative(realizedProfitUsd1y), percentage: percentageOf(realizedProfitUsd1y, soldCostUsd) };

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
      headlineUsd: realizedProfitUsd1y,
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

  if (!hasSold) return { variant: 'unrealized', ...held, headlineUsd: positionPnlUsd };

  const totalUsd = sumWorklet(realizedProfitUsd1y, positionPnlUsd);
  return {
    variant: 'partiallyRealized',
    ...held,
    realized,
    total: {
      amount: toNative(totalUsd),
      percentage: percentageOf(totalUsd, sumWorklet(divWorklet(position.cost, usdToNativeRate), soldCostUsd)),
    },
    headlineUsd: totalUsd,
  };
}

function percentageOf(amount: string, cost: string): string | null {
  return greaterThanWorklet(cost, 0) ? mulWorklet(divWorklet(amount, cost), 100) : null;
}
