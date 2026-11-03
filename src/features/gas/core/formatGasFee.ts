import { formatUnits } from 'viem';

import { type NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { safeBigInt } from '@/framework/core/utils/safeBigInt';
import { add, formatNumber, multiply } from '@/helpers/utilities';

import { type GasSettings } from '../types/gas';
import { weiToGwei } from './gasParams';

/**
 * Formats a gas fee in the user's currency, falling back to Gwei when the asset has no price.
 */
export function formatGasFee(
  gasFee: string,
  decimals: number,
  price: number | null | undefined,
  currency: NativeCurrencyKey
): string | undefined {
  if (isNaN(Number(gasFee))) return;
  if (price == null) return `${formatNumber(weiToGwei(gasFee))} Gwei`;

  const amount = formatUnits(safeBigInt(gasFee), decimals);
  return convertAmountToNativeDisplayWorklet(multiply(price, amount), currency, true);
}

/**
 * Formats the estimated and maximum fee per gas in Gwei.
 */
export function formatGasFeeRange(gasSettings: GasSettings | undefined, currentBaseFee: string | undefined) {
  if (!gasSettings) return undefined;

  if (!gasSettings.isEIP1559) return `${formatNumber(weiToGwei(gasSettings.gasPrice))} Gwei`;

  const maxFee = formatNumber(weiToGwei(add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee)));

  if (!currentBaseFee) return `${maxFee} Gwei`;

  const minFee = formatNumber(weiToGwei(add(currentBaseFee, gasSettings.maxPriorityFee)));

  return `${minFee} - ${maxFee} Gwei`;
}
