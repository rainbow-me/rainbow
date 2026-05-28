import type { StaticJsonRpcProvider } from '@ethersproject/providers';

import { time } from '@/framework/core/utils/time';
import { RainbowError } from '@/logger';

const WALLET_CONFIRMATION_TIMEOUT_MS = time.minutes(2);

/**
 * Waits for each wallet-submitted transaction to confirm with a successful receipt.
 */
export async function waitForWalletTransactions({
  provider,
  txHashes,
}: {
  provider: StaticJsonRpcProvider;
  txHashes: string[];
}): Promise<void> {
  for (const hash of txHashes) {
    const receipt = await provider.waitForTransaction(hash, 1, WALLET_CONFIRMATION_TIMEOUT_MS);

    if (!receipt) {
      throw new RainbowError(`[waitForWalletTransactions]: wallet transaction was not confirmed (${hash})`);
    }

    if (receipt.status === 0) {
      throw new RainbowError(`[waitForWalletTransactions]: wallet transaction failed (${hash})`);
    }
  }
}
