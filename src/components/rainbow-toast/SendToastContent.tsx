import { ChainImage } from '@/components/coin-icon/ChainImage';
import { SFSymbolIcon } from '@/components/icons/SFSymbolIcon';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import type { RainbowToastSend } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import React from 'react';

export function SendToastContent({ toast }: { toast: RainbowToastSend }) {
  const icon = <SendToastIcon toast={toast} />;

  const title = toast.status === TransactionStatus.sent ? 'Sent' : toast.status === TransactionStatus.failed ? 'Failed' : 'Sending';

  const subtitle = toast.displayAmount;

  return (
    <ToastContent
      key={toast.status}
      icon={icon}
      title={title}
      subtitle={subtitle}
      type={toast.status === TransactionStatus.failed ? 'error' : undefined}
    />
  );
}

export const SendToastIcon = ({ toast, size = TOAST_ICON_SIZE }: { toast: RainbowToastSend; size?: number }) => {
  if (toast.status === TransactionStatus.sending || toast.status === TransactionStatus.pending) {
    return <ChainImage chainId={toast.chainId} size={size} />;
  }

  if (toast.status === TransactionStatus.sent) {
    return <SFSymbolIcon size={size} name="check" />;
  }

  if (toast.status === TransactionStatus.failed) {
    return <SFSymbolIcon size={size} name="exclamationMark" />;
  }

  return null;
};
