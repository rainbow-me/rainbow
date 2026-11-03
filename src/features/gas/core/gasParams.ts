import { add, divide, multiply, type BigNumberish } from '@/helpers/utilities';
import ethUnits from '@/references/ethereum-units.json';

import { type GasSettings, type LegacyTransactionGasParamAmounts, type TransactionGasParamAmounts } from '../types/gas';

/**
 * Builds raw transaction gas params from `GasSettings`.
 *
 * Returns either:
 * - `{ maxFeePerGas, maxPriorityFeePerGas }` for EIP-1559 gas
 * - `{ gasPrice }` for legacy gas
 */
export function buildGasParams(gasSettings: GasSettings): TransactionGasParamAmounts | LegacyTransactionGasParamAmounts {
  if (!gasSettings.isEIP1559) return { gasPrice: gasSettings.gasPrice };

  return {
    maxFeePerGas: add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee),
    maxPriorityFeePerGas: gasSettings.maxPriorityFee,
  };
}

export const gweiToWei = (gweiAmount: BigNumberish): string => multiply(gweiAmount, ethUnits.gwei);

export const weiToGwei = (weiAmount: BigNumberish): string => divide(weiAmount, ethUnits.gwei);
