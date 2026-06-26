import { ethers, type BigNumber } from 'ethers';

import { POLYMARKET_PUSD_DECIMALS } from '@/features/polymarket/constants';
import {
  divWorklet,
  greaterThanWorklet,
  lessThanWorklet,
  mulWorklet,
  subWorklet,
  toStringWorklet,
  truncateToDecimals,
} from '@/framework/core/safeMath';

type FeeValue = {
  notionalUsd: string | number;
  price: string | number;
};

type MatchedAmounts = {
  tokens: string | number;
  usd: string | number;
};

type FeeCollectionValue = {
  matchedAmounts: MatchedAmounts;
  quotedFeeUsd: string | number;
};

const FEE_RATE_CAP = '0.03';
const FEE_TAPER_MULTIPLIER = '0.14';

/**
 * Calculates the trade fee for one executed notional at one price.
 */
export function calculateTradeFeeUsd({ notionalUsd, price }: FeeValue): string {
  return mulWorklet(notionalUsd, calculateFeeRate(price));
}

/**
 * Calculates the executed trade fee amount to collect, capped to the quoted fee
 * reserved before order submission.
 */
export function calculateFeeToCollectUsd({ matchedAmounts, quotedFeeUsd }: FeeCollectionValue): string {
  const quotedFee = toStringWorklet(quotedFeeUsd);
  if (!greaterThanWorklet(quotedFee, '0')) return '0';

  const fee = calculateMatchedTradeFeeUsd(matchedAmounts);
  return lessThanWorklet(fee, quotedFee) ? fee : quotedFee;
}

/**
 * Converts a USD fee into pUSDC units for Polymarket collateral transactions.
 */
export function getTradeFeeAmount(feeUsd: string | number): BigNumber {
  const fee = toStringWorklet(feeUsd);
  if (!greaterThanWorklet(fee, '0')) return ethers.constants.Zero;

  return ethers.utils.parseUnits(truncateToDecimals(fee, POLYMARKET_PUSD_DECIMALS), POLYMARKET_PUSD_DECIMALS);
}

function calculateFeeRate(price: string | number): string {
  const taperDistance = subWorklet('1', price);
  if (!greaterThanWorklet(taperDistance, '0')) return '0';

  const taperRate = mulWorklet(FEE_TAPER_MULTIPLIER, taperDistance);
  return lessThanWorklet(taperRate, FEE_RATE_CAP) ? taperRate : FEE_RATE_CAP;
}

function calculateMatchedTradeFeeUsd({ tokens, usd }: MatchedAmounts): string {
  if (!greaterThanWorklet(tokens, '0') || !greaterThanWorklet(usd, '0')) return '0';
  return calculateTradeFeeUsd({ notionalUsd: usd, price: divWorklet(usd, tokens) });
}
