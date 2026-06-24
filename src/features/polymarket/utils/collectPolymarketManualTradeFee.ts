import { type Address } from 'viem';

import { POLYMARKET_RAINBOW_FEE_RECIPIENT_ADDRESS } from '@/features/polymarket/constants';
import { buildUnwrapPusdToUsdcTransactions } from '@/features/polymarket/utils/collateral';
import {
  calculatePolymarketManualFeeUsd,
  capPolymarketManualFeeUsd,
  getPolymarketManualFeeAmount,
} from '@/features/polymarket/utils/polymarketManualFee';
import { getPolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { executeRelayTransaction } from '@/features/polymarket/utils/relayExecution';
import { ensureError, logger, RainbowError } from '@/logger';

type CollectPolymarketManualTradeFeeParams = {
  matchedTokenAmount: string | number;
  maxFeeUsd?: string | number;
  orderId: string;
  side: 'buy' | 'sell';
  tokenId: string;
};

export async function collectPolymarketManualTradeFee({
  matchedTokenAmount,
  maxFeeUsd,
  orderId,
  side,
  tokenId,
}: CollectPolymarketManualTradeFeeParams): Promise<void> {
  let feeAmountUsd = '0';
  let proxyAddress: Address | undefined;

  try {
    feeAmountUsd = capPolymarketManualFeeUsd({
      feeUsd: calculatePolymarketManualFeeUsd(matchedTokenAmount),
      maxFeeUsd,
    });

    const amount = getPolymarketManualFeeAmount(feeAmountUsd);
    if (amount.isZero()) return;

    const wallet = await getPolymarketWallet();
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
    logger.error(new RainbowError('[collectPolymarketManualTradeFee] Error collecting fee', error), {
      feeAmountUsd,
      matchedTokenAmount: String(matchedTokenAmount),
      maxFeeUsd: maxFeeUsd === undefined ? undefined : String(maxFeeUsd),
      orderId,
      proxyAddress,
      side,
      tokenId,
    });
  }
}
