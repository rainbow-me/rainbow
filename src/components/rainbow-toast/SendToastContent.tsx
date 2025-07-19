import { ChainImage } from '@/components/coin-icon/ChainImage';
import { SFSymbolIcon } from '@/components/rainbow-toast/SFSymbolIcon';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import type { RainbowToastSend } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import * as i18n from '@/languages';
import React from 'react';

export const getSendToastStatusLabel = (toast: RainbowToastSend) => {
  return toast.status === TransactionStatus.sent
    ? i18n.t(i18n.l.toasts.send.sent)
    : toast.status === TransactionStatus.failed
      ? i18n.t(i18n.l.toasts.send.failed)
      : i18n.t(i18n.l.toasts.send.sending);
};

export function SendToastContent({ toast }: { toast: RainbowToastSend }) {
  const title = getSendToastStatusLabel(toast);
  const subtitle = toast.displayAmount;

  return (
    <ToastContent
      key={toast.status}
      icon={<SendToastIcon toast={toast} />}
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
