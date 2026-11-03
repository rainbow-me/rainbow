import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { greaterThan, multiply } from '@/helpers/utilities';
import { type TokenData } from '@/state/liveTokens/types';

/** Formats a token holding's value and reports whether its liquidity cap was applied. */
export function formatLiquidityCappedBalance(
  token: TokenData,
  balanceAmount: string,
  nativeCurrency: SupportedCurrencyKey
): { balance: string; isCapped: boolean } {
  const liquidityCap = token.reliability?.metadata?.liquidityCap;
  const balance = multiply(token.price, balanceAmount);

  if (liquidityCap && greaterThan(balance, liquidityCap)) {
    return {
      balance: convertAmountToNativeDisplayWorklet(liquidityCap, nativeCurrency),
      isCapped: true,
    };
  }

  return {
    balance: convertAmountAndPriceToNativeDisplay(balanceAmount, token.price, nativeCurrency).display,
    isCapped: false,
  };
}
