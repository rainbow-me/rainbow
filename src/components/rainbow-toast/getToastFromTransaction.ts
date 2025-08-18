import { type RainbowToast } from '@/components/rainbow-toast/types';
import { RainbowTransaction } from '@/entities';

export const txIdToToastId = (tx: RainbowTransaction): string => tx.hash + (tx.chainId || tx.asset?.chainId);

export function getToastUpdatedAt(tx: RainbowTransaction): number {
  // pending transactions use the timestamp field, while mined ones use the minedAt field.
  // minedAt is in seconds, but timestamp is in milliseconds.
  return (tx.minedAt != null ? tx.minedAt * 1000 : tx.timestamp) ?? 0;
}

export function getToastFromTransaction(transaction: RainbowTransaction): RainbowToast | null {
  return {
    id: txIdToToastId(transaction),
    updatedAt: getToastUpdatedAt(transaction),
    transaction,
    isRemoving: false,
  };
}
