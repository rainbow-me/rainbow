import { ChainImage } from '@/components/coin-icon/ChainImage';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { ToastSFSymbolIcon } from '@/components/rainbow-toast/ToastSFSymbolIcon';
import type { RainbowToastSend } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import React from 'react';

export const SendToastIcon = ({ toast, size = TOAST_ICON_SIZE }: { toast: RainbowToastSend; size?: number }) => {
  if (toast.status === TransactionStatus.sending || toast.status === TransactionStatus.pending) {
    return <ChainImage chainId={toast.chainId} size={size} />;
  }

  if (toast.status === TransactionStatus.sent) {
    return <ToastSFSymbolIcon size={size} name="check" />;
  }

  if (toast.status === TransactionStatus.failed) {
    return <ToastSFSymbolIcon size={size} name="exclamationMark" />;
  }

  return null;
};
