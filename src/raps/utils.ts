import { Network } from '@/helpers';
import {
  GasFeeParamsBySpeed,
  LegacyGasFeeParamsBySpeed,
  LegacyTransactionGasParamAmounts,
  TransactionGasParamAmounts,
} from '@/entities';
import { ethereumUtils, gasUtils } from '@/utils';
import { add, greaterThan } from '@/helpers/utilities';

export const overrideWithFastSpeedIfNeeded = ({
  gasParams,
  chainId,
  gasFeeParamsBySpeed,
}: {
  gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
  chainId: number;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
}): TransactionGasParamAmounts | LegacyTransactionGasParamAmounts => {
  if (chainId !== ethereumUtils.getChainIdFromNetwork(Network.mainnet)) {
    return gasParams;
  }
  const transactionGasParams = gasParams as TransactionGasParamAmounts;
  const txnGasFeeParamsBySpeed = gasFeeParamsBySpeed as GasFeeParamsBySpeed;

  const fastMaxPriorityFeePerGas =
    txnGasFeeParamsBySpeed?.[gasUtils.FAST]?.maxPriorityFeePerGas?.amount;

  const fastMaxFeePerGas = add(
    txnGasFeeParamsBySpeed?.[gasUtils.FAST]?.maxBaseFee?.amount,
    fastMaxPriorityFeePerGas
  );

  if (greaterThan(fastMaxFeePerGas, transactionGasParams?.maxFeePerGas || 0)) {
    transactionGasParams.maxFeePerGas = fastMaxFeePerGas;
  }

  if (
    greaterThan(
      fastMaxPriorityFeePerGas,
      transactionGasParams?.maxPriorityFeePerGas || 0
    )
  ) {
    transactionGasParams.maxPriorityFeePerGas = fastMaxPriorityFeePerGas;
  }

  return transactionGasParams;
};
