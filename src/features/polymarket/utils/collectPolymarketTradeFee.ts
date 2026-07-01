import { type Address } from 'viem';

import { POLYMARKET_RAINBOW_FEE_RECIPIENT_ADDRESS } from '@/features/polymarket/constants';
import { buildUnwrapPusdToUsdcTransactions } from '@/features/polymarket/utils/collateral';
import { calculateFeeToCollectUsd, getTradeFeeAmount } from '@/features/polymarket/utils/polymarketTradeFee';
import { getPolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { executeRelayTransaction } from '@/features/polymarket/utils/relayExecution';
import { ensureError, logger, RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';

type CollectTradeFeeParams = {
  matchedAmounts: {
    tokens: string | number;
    usd: string | number;
  };
  orderId: string;
  quotedFeeUsd: string | number;
  side: 'buy' | 'sell';
  tokenId: string;
};

/**
 * Collects the matched order trade fee, capped by the quoted fee reservation.
 */
export async function collectPolymarketTradeFee({
  matchedAmounts,
  orderId,
  quotedFeeUsd,
  side,
  tokenId,
}: CollectTradeFeeParams): Promise<void> {
  let feeAmountUsd = '0';
  let proxyAddress: Address | undefined;

  try {
    feeAmountUsd = calculateFeeToCollectUsd({ matchedAmounts, quotedFeeUsd });

    const amount = getTradeFeeAmount(feeAmountUsd);
    if (amount.isZero()) return;

    const owner = useWalletsStore.getState().accountAddress;
    if (!owner) throw new RainbowError('[polymarket] No active account address');

    const wallet = await getPolymarketWallet(owner);
    proxyAddress = wallet.address;

    const transactions = await buildUnwrapPusdToUsdcTransactions({
      amount,
      proxyAddress,
      recipient: POLYMARKET_RAINBOW_FEE_RECIPIENT_ADDRESS,
    });
    if (!transactions.length) return;

    await executeRelayTransaction(transactions, 'collect Rainbow Polymarket fee');
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
