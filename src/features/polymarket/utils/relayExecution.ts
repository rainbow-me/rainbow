import { type RelayerTransaction, type RelayerTransactionResponse } from '@polymarket/builder-relayer-client';

import { awaitPolygonConfirmation } from './confirmation';
import { assertRelayerTransactionAccepted, waitForRelayerSettlement } from './relayResponse';

export async function waitForRelayerTransaction(
  response: RelayerTransactionResponse,
  description: string
): Promise<Pick<RelayerTransaction, 'transactionID' | 'transactionHash' | 'state'>> {
  if (response.transactionHash) {
    assertRelayerTransactionAccepted(response, description);
    await awaitPolygonConfirmation(response.transactionHash);
    return response;
  }

  const transaction = await waitForRelayerSettlement(response, description);

  if (transaction.transactionHash) {
    await awaitPolygonConfirmation(transaction.transactionHash);
  }

  return transaction;
}
