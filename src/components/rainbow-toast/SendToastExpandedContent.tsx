import { SendToastIcon } from '@/components/rainbow-toast/SendToastContent';
import { TransactionStatus } from '@/entities';
import React from 'react';
import { ToastExpandedContent } from './ToastExpandedContent';
import { RainbowToastSend } from './types';

export function SendToastExpandedContent({ toast }: { toast: RainbowToastSend }) {
  const title = `${toast.token}`;
  const subtitle =
    toast.status === TransactionStatus.sending || TransactionStatus.pending
      ? 'Sending...'
      : toast.status === TransactionStatus.sent
        ? 'Sent'
        : 'Failed';

  const icon = <SendToastIcon toast={toast} />;

  return <ToastExpandedContent icon={icon} statusLabel={subtitle} label={title} transaction={toast.transaction} />;
}
