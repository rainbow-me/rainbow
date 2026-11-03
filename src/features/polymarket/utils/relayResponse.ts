import { RelayerTransactionState, type RelayerTransaction, type RelayerTransactionResponse } from '@polymarket/builder-relayer-client';

import { RainbowError } from '@/logger';

/**
 * Waits until the relayer observes a transaction as mined or confirmed.
 */
export async function waitForRelayerSettlement(response: RelayerTransactionResponse, description: string): Promise<RelayerTransaction> {
  assertRelayerTransactionAccepted(response, description);

  const transaction = (await response.wait()) ?? (await response.getTransaction())[0];
  if (transaction) assertRelayerTransactionAccepted(transaction, description);

  switch (transaction?.state) {
    case RelayerTransactionState.STATE_MINED:
    case RelayerTransactionState.STATE_CONFIRMED:
      return transaction;
    default:
      throw new RainbowError(`[polymarket] ${description} did not confirm`);
  }
}

export function assertRelayerTransactionAccepted({ state }: Pick<RelayerTransactionResponse, 'state'>, description: string): void {
  if (state === RelayerTransactionState.STATE_FAILED) {
    throw new RainbowError(`[polymarket] ${description} failed`);
  }

  if (state === RelayerTransactionState.STATE_INVALID) {
    throw new RainbowError(`[polymarket] ${description} rejected as invalid`);
  }
}
