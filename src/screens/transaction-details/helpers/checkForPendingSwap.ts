import { RainbowTransaction } from '@/entities';

export const checkForPendingSwap = (transaction: RainbowTransaction) => {
  return ['swap', 'wrap', 'unwrap'].includes(transaction.type) && transaction.status === 'pending';
};
