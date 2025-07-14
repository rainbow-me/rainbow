import { SendToastIcon } from '@/components/rainbow-toast/SendToastContent';
import { TransactionStatus } from '@/entities';
import { usePendingTransactionByHash } from '@/hooks/usePendingTransactions';
import React from 'react';
import { ToastExpandedAfterTransaction } from './ToastExpandedAfterTransaction';
import { ToastExpandedContent } from './ToastExpandedContent';
import { RainbowToastSend } from './types';

export function SendToastExpandedContent({ toast }: { toast: RainbowToastSend }) {
  const { transactionHash } = toast;
  const tx = usePendingTransactionByHash(transactionHash);

  if (!tx) {
    return null;
  }

  const title = `${toast.token}`;
  const subtitle = toast.status === TransactionStatus.sending ? 'Sending...' : toast.status === TransactionStatus.sent ? 'Sent' : 'Failed';

  const icon = <SendToastIcon toast={toast} />;
  const after = <ToastExpandedAfterTransaction topLabel="0.05 ETH" bottomLabel="- $92.50" />;

  return <ToastExpandedContent icon={icon} statusLabel={subtitle} label={title} after={after} />;
}
