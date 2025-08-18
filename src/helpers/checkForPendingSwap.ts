import { RainbowTransaction, TransactionStatus } from '@/entities';

export const checkForSwap = (transaction: RainbowTransaction) => {
  return ['swap', 'wrap', 'unwrap'].includes(transaction.type);
};

export const checkForPendingSwap = (transaction: RainbowTransaction) => {
  return checkForSwap(transaction) && transaction.status === TransactionStatus.pending;
};
