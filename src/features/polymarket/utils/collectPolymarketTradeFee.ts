import { POLYMARKET_RAINBOW_FEE_RECIPIENT_ADDRESS } from '@/features/polymarket/constants';
import { buildUnwrapPusdToUsdcTransactions } from '@/features/polymarket/utils/collateral';
import { awaitPolygonConfirmation } from '@/features/polymarket/utils/confirmation';
import { calculateFeeToCollectUsd, getTradeFeeAmount } from '@/features/polymarket/utils/polymarketTradeFee';
import { type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { waitForRelayerTransaction } from '@/features/polymarket/utils/relayExecution';
import { ensureError, logger, RainbowError } from '@/logger';

/** Polygon transactions that settle a matched Polymarket order. */
export type SettlementTransactionHashes = readonly [string, ...string[]];

type CollectTradeFeeParams = {
  wallet: PolymarketWallet;
  matchedAmounts: {
    tokens: string | number;
    usd: string | number;
  };
  orderId: string;
  quotedFeeUsd: string | number;
  side: 'buy' | 'sell';
  settlementTransactionHashes: SettlementTransactionHashes;
  tokenId: string;
};

/**
 * Collects the matched order trade fee, capped by the quoted fee reservation.
 */
export async function collectPolymarketTradeFee({
  matchedAmounts,
  wallet,
  orderId,
  quotedFeeUsd,
  side,
  settlementTransactionHashes,
  tokenId,
}: CollectTradeFeeParams): Promise<void> {
  let feeAmountUsd = '0';
  const proxyAddress = wallet.address;

  try {
    feeAmountUsd = calculateFeeToCollectUsd({ matchedAmounts, quotedFeeUsd });

    const amount = getTradeFeeAmount(feeAmountUsd);
    if (amount.isZero()) return;

    await waitForSettlementTransactions(settlementTransactionHashes);

    const transactions = await buildUnwrapPusdToUsdcTransactions({
      amount,
      proxyAddress,
      recipient: POLYMARKET_RAINBOW_FEE_RECIPIENT_ADDRESS,
    });
    if (!transactions.length) return;

    const description = 'collect Rainbow Polymarket fee';
    await waitForRelayerTransaction(await wallet.execute(transactions, description), description);
  } catch (e) {
    const error = ensureError(e);
    logger.error(new RainbowError('[collectPolymarketTradeFee] Error collecting fee', error), {
      feeAmountUsd,
      matchedTokens: String(matchedAmounts.tokens),
      matchedUsd: String(matchedAmounts.usd),
      orderId,
      quotedFeeUsd: String(quotedFeeUsd),
      side,
      tokenId,
    });
  }
}

async function waitForSettlementTransactions(transactionHashes: SettlementTransactionHashes): Promise<void> {
  await Promise.all(transactionHashes.map(hash => awaitPolygonConfirmation(hash)));
}
