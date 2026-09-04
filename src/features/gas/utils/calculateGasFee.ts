import { type GasSettings } from '@/features/gas/types/gas';
import { isNumberStringWorklet, lessThanWorklet, mulWorklet, sumWorklet } from '@/framework/core/safeMath';

function safeFeeWorklet(value: string | undefined): string {
  'worklet';
  return typeof value === 'string' && isNumberStringWorklet(value) ? value : '0';
}

function calculateEIP1559GasFeeWorklet(gasLimit: string, baseFee: string, priorityFee: string): string {
  'worklet';
  return mulWorklet(gasLimit, sumWorklet(baseFee, priorityFee));
}

export function calculateMaxGasFeeWorklet(gasSettings: GasSettings, gasLimit: string): string {
  'worklet';
  if (gasSettings.isEIP1559) {
    return calculateEIP1559GasFeeWorklet(gasLimit, safeFeeWorklet(gasSettings.maxBaseFee), safeFeeWorklet(gasSettings.maxPriorityFee));
  }

  return mulWorklet(gasLimit, safeFeeWorklet(gasSettings.gasPrice));
}

export function calculateEstimatedGasFeeWorklet(gasSettings: GasSettings, gasLimit: string, currentBaseFee: string | undefined): string {
  'worklet';
  if (!gasSettings.isEIP1559 || !currentBaseFee || !isNumberStringWorklet(currentBaseFee)) {
    return calculateMaxGasFeeWorklet(gasSettings, gasLimit);
  }

  const maxBaseFee = safeFeeWorklet(gasSettings.maxBaseFee);
  const estimatedBaseFee = lessThanWorklet(currentBaseFee, maxBaseFee) ? currentBaseFee : maxBaseFee;
  return calculateEIP1559GasFeeWorklet(gasLimit, estimatedBaseFee, safeFeeWorklet(gasSettings.maxPriorityFee));
}
