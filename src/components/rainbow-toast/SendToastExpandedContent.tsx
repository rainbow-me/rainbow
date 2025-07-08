import { SendToastIcon } from '@/components/rainbow-toast/SendToastContent';
import { usePendingTransactionByHash } from '@/hooks/usePendingTransactions';
import React from 'react';
import { ToastExpandedAfterTransaction } from './ToastExpandedAfterTransaction';
import { ToastExpandedContent } from './ToastExpandedContent';
import { RainbowToastSend } from './types';

export function SendToastExpandedContent({ toast }: { toast: RainbowToastSend }) {
  const { transactionHash } = toast;
  const tx = usePendingTransactionByHash(transactionHash);

  console.log('/??', transactionHash, tx);

  if (!tx) {
    return null;
  }

  const title = toast.status === 'sending' ? 'Sending...' : toast.status === 'sent' ? 'Sent' : 'Failed';
  const subtitle = `${toast.amount} ${toast.token}`;
  // const status = tx.status === 'pending' ? 'Pending' : 'Sent';

  const icon = <SendToastIcon toast={toast} />;
  const after = <ToastExpandedAfterTransaction topLabel="0.05 ETH" bottomLabel="- $92.50" />;

  return <ToastExpandedContent icon={icon} statusLabel={subtitle} label={title} after={after} />;
}
