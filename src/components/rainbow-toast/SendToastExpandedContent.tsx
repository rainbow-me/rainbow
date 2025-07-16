import { SendToastIcon } from '@/components/rainbow-toast/SendToastContent';
import { TransactionStatus } from '@/entities';
import React from 'react';
import { EXPANDED_ICON_SIZE, ToastExpandedContent } from './ToastExpandedContent';
import { RainbowToastSend } from './types';

export function SendToastExpandedContent({ toast }: { toast: RainbowToastSend }) {
  const title = `${toast.token}`;
  const isLoading = toast.status === TransactionStatus.sending || toast.status === TransactionStatus.pending;
  const subtitle = isLoading ? 'Sending' : toast.status === TransactionStatus.sent ? 'Sent' : 'Failed';

  const icon = <SendToastIcon size={EXPANDED_ICON_SIZE} toast={toast} />;

  return <ToastExpandedContent isLoading={isLoading} icon={icon} statusLabel={subtitle} label={title} transaction={toast.transaction} />;
}
