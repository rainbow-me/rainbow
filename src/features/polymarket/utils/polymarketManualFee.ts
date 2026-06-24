import { ethers, type BigNumber } from 'ethers';

import { POLYMARKET_PUSD_DECIMALS, POLYMARKET_RAINBOW_FEE_USD_PER_TOKEN } from '@/features/polymarket/constants';
import { greaterThanWorklet, lessThanWorklet, mulWorklet, toStringWorklet, truncateToDecimals } from '@/framework/core/safeMath';

export function calculatePolymarketManualFeeUsd(tokenAmount: string | number): string {
  return mulWorklet(tokenAmount, POLYMARKET_RAINBOW_FEE_USD_PER_TOKEN);
}

export function capPolymarketManualFeeUsd({ feeUsd, maxFeeUsd }: { feeUsd: string | number; maxFeeUsd?: string | number }): string {
  const fee = toStringWorklet(feeUsd);
  if (maxFeeUsd === undefined) return fee;

  const maxFee = toStringWorklet(maxFeeUsd);
  if (!greaterThanWorklet(maxFee, '0')) return '0';

  return lessThanWorklet(fee, maxFee) ? fee : maxFee;
}

export function getPolymarketManualFeeAmount(feeUsd: string | number): BigNumber {
  const fee = toStringWorklet(feeUsd);
  if (!greaterThanWorklet(fee, '0')) return ethers.constants.Zero;

  return ethers.utils.parseUnits(truncateToDecimals(fee, POLYMARKET_PUSD_DECIMALS), POLYMARKET_PUSD_DECIMALS);
}
