import { divWorklet, greaterThanWorklet, minWorklet, mulWorklet, subWorklet } from '@/framework/core/safeMath';

export type TokenAcquisition = {
  purchasedTokenBalance: string;
  tokenAcquisitionCostUsd: string;
};

export type UnrealizedPnl = {
  /** Signed, in the native currency. */
  amount: string;
  /** Signed, relative to the cost of the held tokens, where 1 is 1%. */
  percentage: string;
};

/**
 * Unrealized P&L of the swap-acquired tokens the wallet still holds, or `null` when there is no cost basis or price.
 *
 * Codex does not reduce `purchasedTokenBalance` when tokens are sent out, so the purchased amount is capped
 * at the current balance and costed at its average acquisition price. Received tokens have no cost basis
 * and are excluded.
 */
export function calculateUnrealizedPnl({
  acquisition: { purchasedTokenBalance, tokenAcquisitionCostUsd },
  balance,
  price,
  usdToNativeRate,
}: {
  acquisition: TokenAcquisition;
  /** Token units held by the wallet. */
  balance: string;
  /** Native currency per token. */
  price: string;
  usdToNativeRate: number;
}): UnrealizedPnl | null {
  if (!greaterThanWorklet(purchasedTokenBalance, 0) || !greaterThanWorklet(balance, 0) || !greaterThanWorklet(price, 0)) return null;

  const heldPurchased = minWorklet(purchasedTokenBalance, balance);
  const heldCostUsd = divWorklet(mulWorklet(tokenAcquisitionCostUsd, heldPurchased), purchasedTokenBalance);
  if (!greaterThanWorklet(heldCostUsd, 0)) return null;

  const heldCost = mulWorklet(heldCostUsd, usdToNativeRate);
  const amount = subWorklet(mulWorklet(heldPurchased, price), heldCost);

  return { amount, percentage: mulWorklet(divWorklet(amount, heldCost), 100) };
}
