import { ethers } from 'ethers';

import { POLYMARKET_PUSD_DECIMALS, POLYMARKET_RAINBOW_FEE_RECIPIENT_ADDRESS } from '@/features/polymarket/constants';
import { PolymarketTransactionFailedError } from '@/features/polymarket/errors';
import { type PolymarketOrderAmounts } from '@/features/polymarket/types';
import { buildUnwrapPusdToUsdcTransactions } from '@/features/polymarket/utils/collateral';
import { awaitPolygonConfirmation } from '@/features/polymarket/utils/confirmation';
import { calculateFeeToCollectUsd, getTradeFeeAmount } from '@/features/polymarket/utils/polymarketTradeFee';
import { type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { waitForRelayerTransaction } from '@/features/polymarket/utils/relayExecution';
import { ensureError, logger, RainbowError } from '@/logger';

/** Polygon transactions that settle a matched Polymarket order. */
export type SettlementTransactionHashes = readonly [string, ...string[]];

type CollectTradeFeeParams = {
  matchedAmounts: PolymarketOrderAmounts;
  orderId: string;
  quotedFeeUsd: string;
  side: 'buy' | 'sell';
  settlementTransactionHashes: SettlementTransactionHashes;
  tokenId: string;
  wallet: PolymarketWallet;
};

/**
 * Collects the matched order trade fee, capped by the quoted fee reservation.
 * Returns undefined when collection remains uncertain so the fee stays reserved.
 */
export async function collectPolymarketTradeFee({
  matchedAmounts,
  orderId,
  quotedFeeUsd,
  side,
  settlementTransactionHashes,
  tokenId,
  wallet,
}: CollectTradeFeeParams): Promise<string | undefined> {
  await Promise.all(settlementTransactionHashes.map(hash => awaitPolygonConfirmation(hash)));
  let feeAmountUsd = '0';
  let submissionAttempted = false;

  try {
    feeAmountUsd = calculateFeeToCollectUsd({ matchedAmounts, quotedFeeUsd });

    const amount = getTradeFeeAmount(feeAmountUsd);
    if (amount.isZero()) return '0';

    const transactions = await buildUnwrapPusdToUsdcTransactions({
      amount,
      proxyAddress: wallet.address,
      recipient: POLYMARKET_RAINBOW_FEE_RECIPIENT_ADDRESS,
    });

    const description = 'collect Rainbow Polymarket fee';
    submissionAttempted = true;
    await waitForRelayerTransaction(await wallet.execute(transactions, description), description);

    return ethers.utils.formatUnits(amount, POLYMARKET_PUSD_DECIMALS);
  } catch (e) {
    const error = ensureError(e);
    logger.error(new RainbowError('[collectPolymarketTradeFee] Error collecting fee', error), {
      feeAmountUsd,
      matchedTokens: matchedAmounts.tokens,
      matchedUsd: matchedAmounts.usd,
      orderId,
      quotedFeeUsd,
      side,
      tokenId,
    });
    if (submissionAttempted && !(error instanceof PolymarketTransactionFailedError)) return undefined;
    return '0';
  }
}
