import { type NewTransaction } from '@/entities/transactions';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { convertNewTransactionToRainbowTransaction } from '@/parsers/transactions';
import { nonceActions } from '@/state/nonces';

import { pendingTransactionsActions } from './index';

/**
 * Adds a pending transaction and advances the account's locally tracked nonce.
 * Relay executions do not use the wallet's local nonce.
 */
export function addNewTransaction({
  address,
  chainId,
  transaction,
}: {
  address: string;
  chainId: ChainId;
  transaction: NewTransaction;
}): void {
  const parsedTransaction = convertNewTransactionToRainbowTransaction(transaction);
  pendingTransactionsActions.addPendingTransaction({ address, pendingTransaction: parsedTransaction });

  if (transaction.relayExecutionId) return;

  const localNonceData = nonceActions.getNonce({ address, chainId });
  const localNonce = localNonceData?.currentNonce || -1;

  if (transaction.nonce > localNonce) {
    nonceActions.setNonce({
      address,
      chainId,
      currentNonce: transaction.nonce,
    });
  }
}
