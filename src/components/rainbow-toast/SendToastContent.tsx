import { ChainImage } from '@/components/coin-icon/ChainImage';
import { SFSymbolIcon } from '@/components/icons/SFSymbolIcon';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import type { RainbowToastSend } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import React from 'react';

export function SendToastContent({ toast }: { toast: RainbowToastSend }) {
  const icon = <SendToastIcon toast={toast} />;
  const title =
    toast.status === TransactionStatus.sending || TransactionStatus.pending
      ? 'Sending'
      : toast.status === TransactionStatus.sent
        ? 'Sent'
        : 'Failed';

  const subtitle = toast.displayAmount;

  return (
    <ToastContent icon={icon} title={title} subtitle={subtitle} type={toast.status === TransactionStatus.failed ? 'error' : undefined} />
  );
}

export const SendToastIcon = ({ toast }: { toast: RainbowToastSend }) => {
  if (toast.status === TransactionStatus.sending || toast.status === TransactionStatus.pending) {
    return <ChainImage chainId={toast.chainId} size={TOAST_ICON_SIZE} />;
  }

  if (toast.status === TransactionStatus.sent) {
    return <SFSymbolIcon name="check" />;
  }

  if (toast.status === TransactionStatus.failed) {
    return <SFSymbolIcon name="exclamationMark" />;
  }

  return null;
};
