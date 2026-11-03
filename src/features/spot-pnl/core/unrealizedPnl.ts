import { divWorklet, greaterThanWorklet, minWorklet, mulWorklet, subWorklet } from '@/framework/core/safeMath';

export type TokenAcquisition = {
  purchasedTokenBalance: string;
  tokenAcquisitionCostUsd: string;
};

export type UnrealizedPnl = {
  /** Token units both purchased and still held. */
  heldBalance: string;
  /** Cost of the held tokens, in the native currency. */
  cost: string;
  /** Current value of the held tokens, in the native currency. */
  value: string;
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

  const heldPurchased = String(minWorklet(purchasedTokenBalance, balance));
  const heldCostUsd = divWorklet(mulWorklet(tokenAcquisitionCostUsd, heldPurchased), purchasedTokenBalance);
  if (!greaterThanWorklet(heldCostUsd, 0)) return null;

  const cost = mulWorklet(heldCostUsd, usdToNativeRate);
  const value = mulWorklet(heldPurchased, price);
  const amount = subWorklet(value, cost);

  return { heldBalance: heldPurchased, cost, value, amount, percentage: mulWorklet(divWorklet(amount, cost), 100) };
}
